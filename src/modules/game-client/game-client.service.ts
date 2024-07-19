import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { GameClientGateway } from './game-client.gateway';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { AnswerRequestDto } from 'src/dto/answer-request.dto';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';
import { EndRoundResponse } from 'src/types/end-round-response.type';
import { GameManagerGateway } from '../game-manager/game-manager.gateway';

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
      throw new BadRequestException('Player already in game');
    }
    if (
      gameState.gamePlayers.some(
        (player) => player.userName === joinGameRequest.playerName,
      )
    ) {
      throw new BadRequestException('Username already taken');
    }

    if (gameState.gameStatus !== GameStatus.CREATED) {
      throw new BadRequestException('Game already started');
    }

    this.gameStateRepository.addUserToGame(joinGameRequest, socketId);
    this.gameManagerGateway.server
      .to(gameState.gameHost)
      .emit('player-joined', { userName: joinGameRequest.playerName });
  }

  async handleBuzzerRequest(
    buzzerRequest: GameRelatedRequestDto,
    socketId: string,
  ) {
    const gameState = await this.gameStateRepository.getGameState(
      buzzerRequest.gameId,
    );

    const player = gameState.gamePlayers.find(
      (player) => player.id === socketId,
    )!;

    const buzzerId = gameState.buzzersGranted.length;

    this.gameStateRepository.saveGameState({
      ...gameState,
      currentGuessingPlayer: socketId,
      buzzersGranted: [...gameState.buzzersGranted, socketId],
    });

    this.gameManagerGateway.server
      .to(gameState.gameHost)
      .emit('buzzer-granted', {
        playerName: player.userName,
      });

    this.gameClientGateway.server
      .to(buzzerRequest.gameId)
      .except(socketId)
      .emit('buzzer-granted');

    setTimeout(async () => {
      const currentGameState = await this.gameStateRepository.getGameState(
        buzzerRequest.gameId,
      );
      const currentBuzzerId = currentGameState.buzzersGranted.length;
      if (
        currentGameState.currentGuessingPlayer === socketId &&
        currentBuzzerId === buzzerId
      ) {
        this.gameStateRepository.saveGameState({
          ...gameState,
          currentGuessingPlayer: null,
        });

        this.gameClientGateway.server
          .to(buzzerRequest.gameId)
          .emit('buzzer-revoked');

        this.gameManagerGateway.server
          .to(buzzerRequest.gameId)
          .emit('buzzer-revoked');
      }
    }, 5000);
  }

  async handleAnswerRequest(answerRequest: AnswerRequestDto, socketId: string) {
    const gameState = await this.gameStateRepository.getGameState(
      answerRequest.gameId,
    );

    const correctAnswer = gameState.currentCorrectAnswer;
    const isCorrect =
      answerRequest.answer.toLowerCase() === correctAnswer?.toLowerCase();

    if (isCorrect) {
      const player = gameState.gamePlayers.find(
        (player) => player.id === socketId,
      )!;
      player.score += 10;

      await this.gameStateRepository.saveGameState({
        ...gameState,
        currentGuessingPlayer: null,
        gameStatus: GameStatus.ROUND_ENDED,
      });

      const endRoundResponse: EndRoundResponse = {
        guessedBy: player.userName,
        correctAnswer: gameState.currentCorrectAnswer ?? '',
        scores: gameState.gamePlayers.map(({ id: _id, ...player }) => player),
      };

      this.gameManagerGateway.server
        .to(gameState.gameHost)
        .emit('round-ended', endRoundResponse);

      this.gameClientGateway.server
        .to(answerRequest.gameId)
        .emit('round-ended');
    } else {
      this.gameStateRepository.saveGameState({
        ...gameState,
        currentGuessingPlayer: null,
      });

      this.gameClientGateway.server
        .to(answerRequest.gameId)
        .emit('buzzer-revoked');
    }
  }
}
