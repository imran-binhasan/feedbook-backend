import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database-connection';
import type { DrizzleDB } from '../database-connection';
import { sessions } from '../schema';
import { hashToken } from '../../../common/utils/crypto.util';
import type {
  SessionInfo,
  SessionPayload,
} from '../../../common/types/request.type';

export interface CreateSessionRecord {
  userId: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class SessionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async create(data: CreateSessionRecord): Promise<SessionInfo> {
    const tokenHash = hashToken(data.token);

    const [session] = await this.db
      .insert(sessions)
      .values({
        userId: data.userId,
        tokenHash,
        expiresAt: data.expiresAt,
      })
      .returning({
        id: sessions.id,
        expiresAt: sessions.expiresAt,
      });

    return { id: session.id, token: data.token, expiresAt: session.expiresAt };
  }

  async findByToken(
    token: string,
  ): Promise<(SessionPayload & { expiresAt: Date }) | null> {
    const [session] = await this.db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)))
      .limit(1);

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    };
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
}
