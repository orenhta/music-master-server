import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';
import Redis from 'ioredis';

export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: Redis) {
    super();
  }

  async isHealthy() {
    try {
      await this.redis.ping();
      return this.getStatus('redis', true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus('redis', false, { message: error.message }),
      );
    }
  }
}
