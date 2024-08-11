import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redisConfig', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
}));
