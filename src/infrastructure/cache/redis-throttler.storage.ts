import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly fallback = new Map<string, { totalHits: number; expiresAt: number; blockUntil: number }>();

  constructor(private readonly redis: Redis | null) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.redis) {
      return this.fallbackIncrement(key, ttl, limit, blockDuration);
    }

    const blockKey = `${key}:block`;

    const blockTtl = await this.redis.pttl(blockKey);
    if (blockTtl > 0) {
      return { totalHits: limit + 1, timeToExpire: ttl, isBlocked: true, timeToBlockExpire: blockTtl };
    }

    await this.redis.set(key, 0, 'PX', ttl, 'NX');
    const totalHits = await this.redis.incr(key);
    const pttl = await this.redis.pttl(key);
    const timeToExpire = pttl > 0 ? pttl : ttl;

    if (totalHits > limit && blockDuration > 0) {
      await this.redis.set(blockKey, 1, 'PX', blockDuration, 'NX');
      const blockPttl = await this.redis.pttl(blockKey);
      return { totalHits, timeToExpire, isBlocked: true, timeToBlockExpire: blockPttl > 0 ? blockPttl : blockDuration };
    }

    return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }

  private fallbackIncrement(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const entry = this.fallback.get(key);

    if (entry && entry.blockUntil > now) {
      return { totalHits: limit + 1, timeToExpire: ttl, isBlocked: true, timeToBlockExpire: entry.blockUntil - now };
    }

    if (!entry || entry.expiresAt <= now) {
      this.fallback.set(key, { totalHits: 1, expiresAt: now + ttl, blockUntil: 0 });
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }

    entry.totalHits += 1;

    if (entry.totalHits > limit && blockDuration > 0) {
      entry.blockUntil = now + blockDuration;
      return { totalHits: entry.totalHits, timeToExpire: entry.expiresAt - now, isBlocked: true, timeToBlockExpire: blockDuration };
    }

    return { totalHits: entry.totalHits, timeToExpire: entry.expiresAt - now, isBlocked: false, timeToBlockExpire: 0 };
  }
}
