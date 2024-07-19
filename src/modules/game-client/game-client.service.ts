import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { GameClientGateway } from './game-client.gateway';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { AnswerRequestDto } from 'src/dto/answer-request.dto';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';

@Injectable()
export class GameClientService {
  constructor(
    @Inject(forwardRef(() => GameClientGateway))
    private gameEventsGateway: GameClientGateway,
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
      throw 'Player already in game';
    }

    if (gameState.round > 0) {
      throw 'Game already started';
    }

    this.gameStateRepository.addUserToGame(joinGameRequest, socketId);
    this.gameEventsGateway.server
      .to(joinGameRequest.gameId)
      .emit('player-joined', { userName: joinGameRequest.playerName });
  }

  async handleBuzzerRequest(
    buzzerRequest: GameRelatedRequestDto,
    socketId: string,
  ) {
    const gameState = await this.gameStateRepository.getGameState(
      buzzerRequest.gameId,
    );

    this.gameStateRepository.saveGameState({
      ...gameState,
      currentGuessingPlayer: socketId,
    });

    this.gameEventsGateway.server
      .to(buzzerRequest.gameId)
      .emit('buzzer-granted', {
        socketId,
      });
  }

  async handleAnswerRequest(answerRequest: AnswerRequestDto, socketId: string) {
    const gameState = await this.gameStateRepository.getGameState(
      answerRequest.gameId,
    );

    const correctAnswer = gameState.currentCorrectAnswer;
    const isCorrect =
      answerRequest.answer.toLowerCase() === correctAnswer?.toLowerCase();

    this.gameStateRepository.saveGameState({
      ...gameState,
      currentGuessingPlayer: null,
    });

    if (isCorrect) {
      const player = gameState.gamePlayers.find(
        (player) => player.id === socketId,
      )!;
      player.score += 10;
      this.gameEventsGateway.server
        .to(answerRequest.gameId)
        .emit('correct-answer');
    } else {
      this.gameEventsGateway.server
        .to(answerRequest.gameId)
        .emit('wrong-answer');
    }
  }
}
