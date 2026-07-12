import { Inject, Injectable } from '@nestjs/common';
import { eq, lt, or, and, desc, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE } from '../database-connection';
import type { DrizzleDB } from '../database-connection';
import { replies, users } from '../schema';

export interface CreateReplyRecord {
  commentId: string;
  userId: string;
  content?: string | null;
}

export interface UpdateReplyRecord {
  content?: string | null;
}

export interface ReplyRow {
  id: string;
  commentId: string;
  userId: string;
  content: string | null;
  likeCount: number;
  createdAt: Date;
}

export interface ReplyWithAuthorRow extends ReplyRow {
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
}

export interface CursorValue {
  createdAt: Date;
  id: string;
}

@Injectable()
export class ReplyRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findById(id: string): Promise<ReplyRow | null> {
    const [row] = await this.db
      .select()
      .from(replies)
      .where(eq(replies.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(data: CreateReplyRecord): Promise<ReplyRow> {
    const [row] = await this.db
      .insert(replies)
      .values({
        commentId: data.commentId,
        userId: data.userId,
        content: data.content ?? null,
      })
      .returning();

    return row;
  }

  async update(
    id: string,
    data: UpdateReplyRecord,
  ): Promise<ReplyRow | null> {
    const setValues: Record<string, unknown> = {};

    if (data.content !== undefined) {
      setValues.content = data.content;
    }

    const [row] = await this.db
      .update(replies)
      .set(setValues)
      .where(eq(replies.id, id))
      .returning();

    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(replies).where(eq(replies.id, id));
  }

  async adjustLikeCount(id: string, delta: 1 | -1): Promise<void> {
    await this.db
      .update(replies)
      .set({ likeCount: sql`GREATEST(${replies.likeCount} + ${delta}, 0)` })
      .where(eq(replies.id, id));
  }

  async getByComment(
    commentId: string,
    cursor: CursorValue | null,
    limit: number,
  ): Promise<ReplyWithAuthorRow[]> {
    const conditions: (SQL | undefined)[] = [eq(replies.commentId, commentId)];

    if (cursor) {
      conditions.push(
        or(
          lt(replies.createdAt, cursor.createdAt),
          and(
            eq(replies.createdAt, cursor.createdAt),
            lt(replies.id, cursor.id),
          ),
        ),
      );
    }

    return this.db
      .select({
        id: replies.id,
        commentId: replies.commentId,
        userId: replies.userId,
        content: replies.content,
        likeCount: replies.likeCount,
        createdAt: replies.createdAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(replies)
      .innerJoin(users, eq(replies.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(replies.createdAt), desc(replies.id))
      .limit(limit + 1);
  }
}
