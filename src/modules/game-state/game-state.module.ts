import { Module } from '@nestjs/common';
import { GameStateRepository } from './game-state.repository';
import Redis from 'ioredis';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { redisConfig } from 'src/config/redis.config';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: Redis,
      useFactory: (config: ConfigType<typeof redisConfig>) => {
        const redisInstance = new Redis({
          host: config.host,
          port: config.port,
        });

        return redisInstance;
      },
      inject: [redisConfig.KEY],
    },
    GameStateRepository,
  ],
  exports: [GameStateRepository],
})
export class GameStateModule {}
