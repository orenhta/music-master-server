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
import { ScoreService } from './score.service';
import { AnswerValidatorService } from './answer-validator.service';
import { AnswerReport } from 'src/types/answer-report.type';
import { Player } from 'src/types/player.type';

@Injectable()
export class GameClientService {
  constructor(
    @Inject(forwardRef(() => GameClientGateway))
    private gameClientGateway: GameClientGateway,
    private readonly gameManagerGateway: GameManagerGateway,
    private readonly gameStateRepository: GameStateRepository,
    private readonly scoreService: ScoreService,
    private readonly answerValidatorService: AnswerValidatorService,
  ) {}

  async addUserToGame(
    joinGameRequest: JoinGameRequestDto,
    socketId: string,
  ): Promise<void> {
    const gameState: GameState = await this.gameStateRepository.getGameState(
      joinGameRequest.gameId,
    );

    if (gameState.gamePlayers[socketId]) {
      throw new WsException('Player already in game');
    }
    if (
      Object.values(gameState.gamePlayers).some(
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
    const player: Player = gameState.gamePlayers[socketId];

    const buzzersGranted = [...gameState.roundData.buzzersGranted, socketId];
    const buzzerId = buzzersGranted.length;
    const buzzerGrantedAt = Date.now();

    this.gameStateRepository.saveGameState({
      ...gameState,
      roundData: {
        ...gameState.roundData,
        currentGuessingPlayer: socketId,
        buzzersGranted,
        buzzerGrantedAt,
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
          if (currentGameState.isPunishmentScoreAllowed) {
            const punishmentScore = this.scoreService.getTimeBasedPunishmentScore(
              buzzerGrantedAt,
              currentGameState.roundData.roundStartedAt,
            );
  
            gameState.gamePlayers[socketId].score += punishmentScore;
          }

          if (gameState.streak?.player === socketId) {
            gameState.streak = undefined;
          }

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
    }, 10_000);
  }

  async handleAnswerRequest(answerRequest: AnswerRequestDto, socketId: string) {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.ROUND_IN_PROGRESS>(
        gameId,
      );
    const player = gameState.gamePlayers[socketId];
    const correctAnswer = gameState.songs[gameState.round - 1];

    const { isArtistCorrect, isTitleCorrect } =
      this.answerValidatorService.validateAnswer(
        answerRequest.answer,
        correctAnswer,
        !!gameState.roundData.artistGuessedBy,
        !!gameState.roundData.songGuessedBy,
      );

    const score = this.scoreService.getScoreForAnswer(
      isArtistCorrect,
      isTitleCorrect,
      gameState?.streak?.player === socketId ? gameState.streak.multiplier : 1,
      gameState.roundData.roundStartedAt,
      gameState.roundData.buzzerGrantedAt!,
      gameState.isTimeBasedScore,
      gameState.isPunishmentScoreAllowed
    );

    if (isArtistCorrect || isTitleCorrect) {
      gameState.streak = {
        player: socketId,
        multiplier:
          gameState?.streak?.player === socketId
            ? gameState.streak.multiplier + 0.1
            : 1.1,
      };
    } else if (gameState.streak?.player === socketId) {
      gameState.streak = undefined;
    }

    gameState.gamePlayers[socketId].score += score;

    if (
      (!!gameState.roundData.artistGuessedBy || isArtistCorrect) &&
      (!!gameState.roundData.songGuessedBy || isTitleCorrect)
    ) {
      const endRoundResponse: EndRoundResponse = {
        songGuessedBy: gameState.roundData.songGuessedBy ?? player.userName,
        artistGuessedBy: gameState.roundData.artistGuessedBy ?? player.userName,
        correctAnswer: gameState.songs[gameState.round - 1],
        scores: Object.values(gameState.gamePlayers),
      };

      await this.gameStateRepository.saveGameState({
        ...gameState,
        gameStatus: GameStatus.ROUND_ENDED,
        roundData: {},
      });

      this.gameManagerGateway.server
        .to(gameState.gameHost)
        .emit(EmittedEvent.ROUND_ENDED, endRoundResponse);
      this.gameClientGateway.server.to(gameId).emit(EmittedEvent.ROUND_ENDED);
    } else {
      const answerReport: AnswerReport = {
        answeredBy: player.userName,
      };
      if (isArtistCorrect) {
        gameState.roundData.artistGuessedBy = socketId;
        answerReport.artist = correctAnswer.artist;
      }
      if (isTitleCorrect) {
        gameState.roundData.songGuessedBy = socketId;
        answerReport.title = correctAnswer.title;
      }

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
        .emit(EmittedEvent.BUZZER_REVOKED, answerReport);
    }
  }

  async handlePlayerDisconnect(socketId: string) {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState = await this.gameStateRepository.getGameState(gameId);
    if (gameId) {
      await this.gameStateRepository.removeGamePlayer(gameId, socketId);
    }

    this.gameManagerGateway.server.emit(
      EmittedEvent.PLAYER_DISCONNECTED,
      gameState.gamePlayers[socketId],
    );
  }
}
