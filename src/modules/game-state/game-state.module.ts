import { Module } from '@nestjs/common';
import { GameStateRepository } from './game-state.repository';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: Redis,
      useFactory: () => {
        const redisInstance = new Redis({
          host: 'localhost',
          port: 6379,
        });

        redisInstance.on('error', (e) => {
          throw new Error(`Redis connection failed: ${e}`);
        });

        return redisInstance;
      },
      inject: [],
    },
    GameStateRepository,
  ],
  exports: [GameStateRepository],
})
export class GameStateModule {}
