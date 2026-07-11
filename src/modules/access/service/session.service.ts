import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SessionRepository } from '../../../infrastructure/database/repositories/session.repository';
import type {
  SessionInfo,
  SessionPayload,
} from '../../../common/types/request.type';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async create(userId: string): Promise<SessionInfo> {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const token = randomBytes(32).toString('hex');

    return this.sessionRepository.create({ userId, token, expiresAt });
  }

  async validate(token: string): Promise<SessionPayload> {
    const result = await this.sessionRepository.findByToken(token);

    if (!result) {
      throw new UnauthorizedException('Invalid session');
    }

    if (new Date() > result.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    return { userId: result.userId, sessionId: result.sessionId };
  }

  async revoke(token: string): Promise<void> {
    await this.sessionRepository.deleteByToken(token);
  }
}
