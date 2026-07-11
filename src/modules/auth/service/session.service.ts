import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE } from "src/infrastructure/database/database-connection";
import { sessions } from "src/infrastructure/database/schema";
import type { DrizzleDB } from "src/infrastructure/database/database-connection";

@Injectable()
export class SessionService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async create(userId: string) {
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    const [session] = await this.db
      .insert(sessions)
      .values({
        userId,
        expiresAt,
      })
      .returning({
        id: sessions.id,
        expiresAt: sessions.expiresAt,
      });

    return session;
  }
}