import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SessionRepository } from '../../../infrastructure/database/repositories/session.repository';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { hashToken } from '../../../common/utils/crypto.util';
import type {
  SessionInfo,
  SessionPayload,
} from '../../../common/types/request.type';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(userId: string): Promise<SessionInfo> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const token = randomBytes(32).toString('hex');

    return this.sessionRepository.create({ userId, token, expiresAt });
  }

  async validate(token: string): Promise<SessionPayload> {
    const cacheKey = `session:${hashToken(token)}`;

    const cached = await this.cacheService.get<SessionPayload & { expiresAt: string }>(cacheKey);
    if (cached) {
      if (new Date() > new Date(cached.expiresAt)) {
        throw new UnauthorizedException('Session expired');
      }
      return { userId: cached.userId, sessionId: cached.sessionId };
    }

    const result = await this.sessionRepository.findByToken(token);

    if (!result) {
      throw new UnauthorizedException('Invalid session');
    }

    if (new Date() > result.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    await this.cacheService.set(cacheKey, result, CACHE_TTL_SECONDS);

    return { userId: result.userId, sessionId: result.sessionId };
  }

  async revoke(token: string): Promise<void> {
    await this.cacheService.del(`session:${hashToken(token)}`);
    await this.sessionRepository.deleteByToken(token);
  }
}