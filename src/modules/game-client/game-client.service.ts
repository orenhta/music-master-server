import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { GameClientGateway } from './game-client.gateway';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { AnswerRequestDto } from 'src/dto/answer-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';
import { EndRoundResponse } from 'src/types/end-round-response.type';
import { GameManagerGateway } from '../game-manager/game-manager.gateway';
import { WsException } from '@nestjs/websockets';
import { isGameStateOfStatus } from 'src/functions/is-game-state-of-status';
import { EmittedEvent } from 'src/enums/emitted-events.enum';

@Injectable()
export class GameClientService {
  constructor(
    @Inject(forwardRef(() => GameClientGateway))
    private gameClientGateway: GameClientGateway,
    private gameManagerGateway: GameManagerGateway,
    private readonly gameStateRepository: GameStateRepository,
  ) {}

  async addUserToGame(
    joinGameRequest: JoinGameRequestDto,
    socketId: string,
  ): Promise<void> {
    const gameState: GameState = await this.gameStateRepository.getGameState(
      joinGameRequest.gameId,
    );

    if (gameState.gamePlayers.some((player) => player.id === socketId)) {
      throw new WsException('Player already in game');
    }
    if (
      gameState.gamePlayers.some(
        (player) => player.userName === joinGameRequest.playerName,
      )
    ) {
      throw new WsException('Username already taken');
    }

    this.gameStateRepository.addUserToGame(joinGameRequest, socketId);
    this.gameManagerGateway.server
      .to(gameState.gameHost)
      .emit(EmittedEvent.PLAYER_JOINED, {
        userName: joinGameRequest.playerName,
      });
  }

  async handleBuzzerRequest(socketId: string) {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.ROUND_IN_PROGRESS>(
        gameId,
      );

    const player = gameState.gamePlayers.find(
      (player) => player.id === socketId,
    )!;

    const buzzersGranted = [...gameState.roundData.buzzersGranted, socketId];
    const buzzerId = buzzersGranted.length;

    this.gameStateRepository.saveGameState({
      ...gameState,
      roundData: {
        ...gameState.roundData,
        currentGuessingPlayer: socketId,
        buzzersGranted,
      },
    });

    this.gameManagerGateway.server
      .to(gameState.gameHost)
      .emit(EmittedEvent.BUZZER_GRANTED, {
        playerName: player.userName,
      });

    this.gameClientGateway.server
      .to(gameId)
      .except(socketId)
      .emit(EmittedEvent.BUZZER_GRANTED);

    setTimeout(async () => {
      const currentGameState =
        await this.gameStateRepository.getGameState(gameId);
      if (isGameStateOfStatus(currentGameState, GameStatus.ROUND_IN_PROGRESS)) {
        const currentBuzzerId =
          currentGameState.roundData.buzzersGranted.length;
        if (
          currentGameState.round === gameState.round &&
          currentGameState.roundData.currentGuessingPlayer === socketId &&
          currentBuzzerId === buzzerId
        ) {
          this.gameStateRepository.saveGameState({
            ...gameState,
            roundData: {
              ...gameState.roundData,
              currentGuessingPlayer: null,
            },
          });

          this.gameClientGateway.server
            .to(gameId)
            .emit(EmittedEvent.BUZZER_REVOKED);

          this.gameManagerGateway.server
            .to(gameState.gameHost)
            .emit(EmittedEvent.BUZZER_REVOKED, {
              answeredBy: player.userName,
            });
        }
      }
    }, 15_000);
  }

  async handleAnswerRequest(answerRequest: AnswerRequestDto, socketId: string) {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.ROUND_IN_PROGRESS>(
        gameId,
      );
    const player = gameState.gamePlayers.find(
      (player) => player.id === socketId,
    )!;
    const correctAnswer = gameState.roundData.currentCorrectAnswer;
    const newGameState = { ...gameState };

    if (!newGameState.roundData.artistGuessedBy) {
      const isArtistCorrect = answerRequest.answer
        .toLowerCase()
        .includes(correctAnswer.artist.toLowerCase());

      if (isArtistCorrect) {
        newGameState.roundData = {
          ...newGameState.roundData,
          artistGuessedBy: player.userName,
        };
        player.score += 5;
      }
    }

    if (!newGameState.roundData.songGuessedBy) {
      const isTitleCorrect = answerRequest.answer
        .toLowerCase()
        .includes(correctAnswer.title.toLowerCase());

      if (isTitleCorrect) {
        newGameState.roundData = {
          ...newGameState.roundData,
          songGuessedBy: player.userName,
        };
        player.score += 10;
      }
    }

    if (
      newGameState.roundData.artistGuessedBy &&
      newGameState.roundData.songGuessedBy
    ) {
      const endRoundResponse: EndRoundResponse = {
        songGuessedBy: newGameState.roundData.songGuessedBy,
        artistGuessedBy: newGameState.roundData.artistGuessedBy,
        correctAnswer: newGameState.roundData.currentCorrectAnswer,
        scores: newGameState.gamePlayers.map(({ id: _, ...player }) => player),
      };

      await this.gameStateRepository.saveGameState({
        ...newGameState,
        gameStatus: GameStatus.ROUND_ENDED,
        roundData: {},
      });

      this.gameManagerGateway.server
        .to(newGameState.gameHost)
        .emit(EmittedEvent.ROUND_ENDED, endRoundResponse);
      this.gameClientGateway.server.to(gameId).emit(EmittedEvent.ROUND_ENDED);
    } else {
      this.gameStateRepository.saveGameState({
        ...newGameState,
        roundData: {
          ...newGameState.roundData,
          currentGuessingPlayer: null,
        },
      });

      this.gameClientGateway.server
        .to(gameId)
        .emit(EmittedEvent.BUZZER_REVOKED);
      this.gameManagerGateway.server
        .to(newGameState.gameHost)
        .emit(EmittedEvent.BUZZER_REVOKED, {
          answeredBy: player.userName,
          ...(!gameState.roundData.artistGuessedBy &&
          newGameState.roundData.artistGuessedBy
            ? { artist: correctAnswer.artist }
            : {}),
          ...(!gameState.roundData.songGuessedBy &&
          newGameState.roundData.songGuessedBy
            ? { title: correctAnswer.title }
            : {}),
        });
    }
  }
}
