import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SEPARATOR } from 'src/constants/constants';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';
import { RedisDirectory } from 'src/enums/redis-directory.enum';
import { SocketType } from 'src/enums/socket-type.enum';
import { GameState } from 'src/types/game-state.type';

const DEFAULT_EXPIRATION_TIME_SECONDS = 60 * 60 * 3; // 3 hours

@Injectable()
export class GameStateRepository {
  constructor(private readonly redis: Redis) {}

  async saveGameState<T extends GameStatus>(
    newGameState: GameState<T>,
    setHost = false,
  ) {
    if (setHost) {
      await this.redis.set(
        `${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${newGameState.gameHost}`,
        JSON.stringify({ gameId: newGameState.gameId, type: SocketType.HOST }),
        'EX',
        DEFAULT_EXPIRATION_TIME_SECONDS,
      );
    }
    await this.redis.set(
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${newGameState.gameId}`,
      JSON.stringify(newGameState),
      'EX',
      DEFAULT_EXPIRATION_TIME_SECONDS,
    );
  }

  async getGameState<T extends GameStatus = GameStatus>(
    gameId: string,
  ): Promise<GameState<T>> {
    const res = await this.redis.get(
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${gameId}`,
    );

    return JSON.parse(res!) as GameState<T>;
  }

  async getGameIdBySocketId(socketId: string): Promise<string> {
    const res = await this.redis.get(
      `${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${socketId}`,
    );

    return JSON.parse(res!)?.gameId;
  }

  async addUserToGame(joinGameRequest: JoinGameRequestDto, socketId: string) {
    const gameState = await this.getGameState(joinGameRequest.gameId);

    await this.saveGameState({
      ...gameState,
      gamePlayers: {
        ...gameState.gamePlayers,
        [socketId]: { userName: joinGameRequest.playerName, score: 0 },
      },
    });

    await this.redis.set(
      `${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${socketId}`,
      JSON.stringify({
        gameId: joinGameRequest.gameId,
        type: SocketType.PLAYER,
      }),
      'EX',
      DEFAULT_EXPIRATION_TIME_SECONDS,
    );
  }

  async deleteGameState(gameId: string) {
    const gameState = await this.getGameState(gameId);
    await this.redis.del(
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${gameId}`,
    );
    Object.keys(gameState.gamePlayers).forEach((playerSocketId) => {
      this.removeSocket(playerSocketId);
    });
    this.removeSocket(gameState.gameHost);
  }

  async removeGamePlayer(gameId: string, socketId: string) {
    const gameState = await this.getGameState(gameId);
    const { [socketId]: _, ...gamePlayers } = gameState.gamePlayers;

    await this.saveGameState({
      ...gameState,
      gamePlayers,
    });

    this.removeSocket(socketId);
  }

  async removeSocket(socketId: string) {
    this.redis.del(`${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${socketId}`);
  }
}
