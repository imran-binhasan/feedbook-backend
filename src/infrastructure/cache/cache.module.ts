import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { REDIS_CLIENT } from './cache.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) return null;

        const logger = new Logger('CacheModule');
        const client = new Redis(url, {
          lazyConnect: false,
          enableReadyCheck: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 5_000,
          retryStrategy: (times) => Math.min(times * 200, 2_000),
        });

        client.on('connect', () => logger.log('Redis client connected.'));
        client.on('ready', () => logger.log('Redis client ready.'));
        client.on('reconnecting', (delay: number) =>
          logger.warn(`Redis reconnecting in ${delay}ms.`),
        );
        client.on('error', (err: Error) =>
          logger.error(`Redis error: ${err.message}`),
        );
        client.on('close', () => logger.warn('Redis connection closed.'));

        return client;
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheModule.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis | null,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        'REDIS_URL not set — caching disabled (running without Redis).',
      );
      return;
    }
    try {
      const pong = await this.client.ping();
      this.logger.log(`Redis connection verified (PING=${pong}).`);
    } catch (err) {
      this.logger.error(
        `Redis ping failed: ${(err as Error).message}. Continuing without cache.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed gracefully.');
    } catch (err) {
      this.logger.error(
        `Error closing Redis connection: ${(err as Error).message}`,
      );
    }
  }
}