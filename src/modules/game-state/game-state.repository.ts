import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_SEPARATOR } from 'src/constants/constants';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';
import { RedisDirectory } from 'src/enums/redis-directory.enum';
import { SocketType } from 'src/enums/socket-type.enum';
import { GameState } from 'src/types/game-state.type';

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
      );
    }
    await this.redis.call(
      'JSON.SET',
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${newGameState.gameId}`,
      '$',
      JSON.stringify(newGameState),
    );
  }

  async getGameState<T extends GameStatus = GameStatus>(
    gameId: string,
  ): Promise<GameState<T>> {
    const res = (await this.redis.call(
      'JSON.GET',
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${gameId}`,
    )) as string;

    return JSON.parse(res!) as GameState<T>;
  }

  async getGameIdBySocketId(socketId: string): Promise<string> {
    const res = await this.redis.get(
      `${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${socketId}`,
    );

    return JSON.parse(res!)?.gameId;
  }

  async addUserToGame(joinGameRequest: JoinGameRequestDto, socketId: string) {
    await this.redis.call(
      'JSON.ARRAPPEND',
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${joinGameRequest.gameId}`,
      '$.gamePlayers',
      JSON.stringify({
        id: socketId,
        userName: joinGameRequest.playerName,
        score: 0,
      }),
    );

    await this.redis.set(
      `${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${socketId}`,
      JSON.stringify({
        gameId: joinGameRequest.gameId,
        type: SocketType.PLAYER,
      }),
    );
  }

  async deleteGameState(gameId: string) {
    const gameState = await this.getGameState(gameId);
    await this.redis.call(
      'JSON.DEL',
      `${RedisDirectory.GAME_STATE}${REDIS_SEPARATOR}${gameId}`,
    );
    gameState.gamePlayers.forEach((player) => {
      this.removeSocket(player.id);
    });
    this.removeSocket(gameState.gameHost);
  }

  async removeSocket(socketId: string) {
    this.redis.del(`${RedisDirectory.SOCKETS}${REDIS_SEPARATOR}${socketId}`);
  }
}
