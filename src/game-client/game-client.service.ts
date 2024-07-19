import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { JoinRoomRequest } from 'src/types/join-game.type';
import { BuzzerRequest } from 'src/types/buzzer-request.type';
import { AnswerRequest } from 'src/types/answer-request.type';
import { GameClientGateway } from './game-client.gateway';
import { GameStateRepository } from 'src/game-state/game-state.repository';

@Injectable()
export class GameClientService {
  constructor(
    @Inject(forwardRef(() => GameClientGateway))
    private gameEventsGateway: GameClientGateway,
    private readonly gameStateRepository: GameStateRepository,
  ) {}

  async addUserToRoom(
    joinGameRequest: JoinRoomRequest,
    socketId: string,
  ): Promise<void> {
    const gameState: GameState = await this.gameStateRepository.getGameState(
      joinGameRequest.gameId,
    );

    if (!gameState) {
      throw 'Game not found';
    }

    if (gameState.gamePlayers.some((player) => player.id === socketId)) {
      throw 'Player already in game';
    }

    if (gameState.round > 0) {
      throw 'Game already started';
    }

    if (joinGameRequest.playerName.trim() === '') {
      throw 'Player name cannot be empty';
    }

    this.gameStateRepository.addUserToRoom(joinGameRequest, socketId);
    this.gameEventsGateway.server
      .to(joinGameRequest.gameId)
      .emit('player-joined', { userName: joinGameRequest.playerName });
  }

  async handleBuzzerRequest(buzzerRequest: BuzzerRequest, socketId: string) {
    const gameState = await this.gameStateRepository.getGameState(
      buzzerRequest.gameId,
    );

    if (!gameState) {
      throw 'Game not found';
    }
    if (gameState.currentGuessingPlayer) {
      throw 'Player already guessed';
    }
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

  async handleAnswerRequest(answerRequest: AnswerRequest, socketId: string) {
    const gameState = await this.gameStateRepository.getGameState(
      answerRequest.gameId,
    );

    if (!gameState) {
      throw 'Game not found';
    }
    if (gameState.currentGuessingPlayer !== socketId) {
      throw 'Player not allowed to answer';
    }

    const correctAnswer = gameState.currentCorrectAnswer;
    const isCorrect =
      answerRequest.answer.toLowerCase() === correctAnswer.toLowerCase();

    this.gameStateRepository.saveGameState({
      ...gameState,
      currentGuessingPlayer: null,
    });

    if (isCorrect) {
      const player = gameState.gamePlayers.find(
        (player) => player.id === socketId,
      );
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
