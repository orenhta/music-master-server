import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { songsById } from 'src/songs';
import { EndRoundResponse } from 'src/types/end-round-response.type';
import { GameHostRequest } from 'src/types/game-host-request';
import { GameCreationResponse } from 'src/types/game-creation-response';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { GameClientGateway } from 'src/modules/game-client/game-client.gateway';

@Injectable()
export class GameManagerService {
  constructor(
    private gameClientGateway: GameClientGateway,
    private readonly gameStateRepository: GameStateRepository,
  ) {}

  async createGame(socketId: string): Promise<GameCreationResponse> {
    const newGameState: GameState = {
      gameId: Math.floor(10000 + Math.random() * 90000).toString(),
      gameHost: socketId,
      round: 0,
      gamePlayers: [],
      currentGuessingPlayer: null,
      currentCorrectAnswer: null,
    };

    this.gameStateRepository.saveGameState(newGameState);

    return {
      gameId: newGameState.gameId,
    };
  }

  async nextRound(
    gameHostRequest: GameHostRequest,
    socketId: string,
  ): Promise<void> {
    const gameState = await this.gameStateRepository.getGameState(
      gameHostRequest.gameId,
    );
    if (!(gameState.gameHost === socketId)) {
      throw new UnauthorizedException('unauthorized');
    }
    if (!gameState) {
      throw new BadRequestException('Game not found');
    }

    const nextRound = gameState.round + 1;
    const song = songsById[nextRound];

    this.gameClientGateway.server
      .to(gameHostRequest.gameId)
      .emit('round-started', {
        round: nextRound,
        songId: nextRound,
        duration: song.duration,
      });

    await this.gameStateRepository.saveGameState({
      ...gameState,
      round: nextRound,
      currentCorrectAnswer: song.title,
    });
  }

  async endRound(
    gameHostRequest: GameHostRequest,
    socketId: string,
  ): Promise<EndRoundResponse> {
    const gameState = await this.gameStateRepository.getGameState(
      gameHostRequest.gameId,
    );
    if (!(gameState.gameHost === socketId)) {
      throw new UnauthorizedException('unauthorized');
    }
    if (!gameState) {
      throw new BadRequestException('Game not found');
    }

    return {
      correctAnswer: gameState.currentCorrectAnswer,
      scores: gameState.gamePlayers.map(({ id, ...player }) => player),
    };
  }

  async endGame(
    gameHostRequest: GameHostRequest,
    socketId: string,
  ): Promise<EndRoundResponse> {
    const gameState = await this.gameStateRepository.getGameState(
      gameHostRequest.gameId,
    );
    if (!(gameState.gameHost === socketId)) {
      throw new UnauthorizedException('unauthorized');
    }
    const endRoundResponse = await this.endRound(gameHostRequest, socketId);
    await this.gameStateRepository.deleteGameState(gameHostRequest.gameId);

    this.gameClientGateway.server.to(gameHostRequest.gameId).emit('game-ended');
    this.gameClientGateway.server
      .in(gameHostRequest.gameId)
      .socketsLeave(gameHostRequest.gameId);
    return endRoundResponse;
  }
}
