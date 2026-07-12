import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './cache.constants';

export interface CacheGetOptions {
  parse?: boolean;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis | null,
  ) {}

  async get<T>(key: string, options: CacheGetOptions = {}): Promise<T | null> {
    const { parse = true } = options;
    if (!this.client) return null;

    try {
      const raw = await this.client.get(key);
      if (raw === null) return null;
      return (parse ? JSON.parse(raw) : (raw as unknown as T)) as T;
    } catch (err) {
      this.logger.warn(
        `cache.get failed for "${key}": ${(err as Error).message}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds <= 0) {
      this.logger.warn(`cache.set called with non-positive TTL for "${key}"`);
      return;
    }

    try {
      const payload = JSON.stringify(value);
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(
        `cache.set failed for "${key}": ${(err as Error).message}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(
        `cache.del failed for "${key}": ${(err as Error).message}`,
      );
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (!this.client) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          200,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(
        `cache.delByPrefix failed for "${prefix}": ${(err as Error).message}`,
      );
    }
  }

  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }
}