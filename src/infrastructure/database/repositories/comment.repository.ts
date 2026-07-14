import { Inject, Injectable } from '@nestjs/common';
import { eq, lt, or, and, desc, sql, type SQL } from 'drizzle-orm';
import { DRIZZLE } from '../database-connection';
import type { DrizzleDB } from '../database-connection';
import { comments, users } from '../schema';

export interface CreateCommentRecord {
  postId: string;
  userId: string;
  content?: string | null;
  imageKey?: string | null;
}

export interface UpdateCommentRecord {
  content?: string | null;
  imageKey?: string | null;
}

export interface CommentRow {
  id: string;
  postId: string;
  userId: string;
  content: string | null;
  imageKey: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
}

export interface CommentWithAuthorRow extends CommentRow {
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
}

export interface CursorValue {
  createdAt: Date;
  id: string;
}

@Injectable()
export class CommentRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findById(id: string): Promise<CommentRow | null> {
    const [row] = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(data: CreateCommentRecord): Promise<CommentRow> {
    const [row] = await this.db
      .insert(comments)
      .values({
        postId: data.postId,
        userId: data.userId,
        content: data.content ?? null,
        imageKey: data.imageKey ?? null,
      })
      .returning();

    return row;
  }

  async update(
    id: string,
    data: UpdateCommentRecord,
  ): Promise<CommentRow | null> {
    const setValues: Record<string, unknown> = {};

    if (data.content !== undefined) {
      setValues.content = data.content;
    }
    if (data.imageKey !== undefined) {
      setValues.imageKey = data.imageKey;
    }

    if (Object.keys(setValues).length === 0) {
      return this.findById(id);
    }

    const [row] = await this.db
      .update(comments)
      .set(setValues)
      .where(eq(comments.id, id))
      .returning();

    return row ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(comments).where(eq(comments.id, id));
  }

  async adjustLikeCount(id: string, delta: 1 | -1): Promise<void> {
    await this.db
      .update(comments)
      .set({ likeCount: sql`GREATEST(${comments.likeCount} + ${delta}, 0)` })
      .where(eq(comments.id, id));
  }

  async adjustReplyCount(id: string, delta: 1 | -1): Promise<void> {
    await this.db
      .update(comments)
      .set({ replyCount: sql`GREATEST(${comments.replyCount} + ${delta}, 0)` })
      .where(eq(comments.id, id));
  }

  async findCommentImageKeysByPost(postId: string): Promise<string[]> {
    const rows = await this.db
      .select({ imageKey: comments.imageKey })
      .from(comments)
      .where(
        and(eq(comments.postId, postId), sql`${comments.imageKey} IS NOT NULL`),
      );
    return rows.map((r) => r.imageKey as string);
  }

  async getByPost(
    postId: string,
    cursor: CursorValue | null,
    limit: number,
  ): Promise<CommentWithAuthorRow[]> {
    limit = Math.min(limit, 100);
    const conditions: (SQL | undefined)[] = [eq(comments.postId, postId)];

    if (cursor) {
      conditions.push(
        or(
          lt(comments.createdAt, cursor.createdAt),
          and(
            eq(comments.createdAt, cursor.createdAt),
            lt(comments.id, cursor.id),
          ),
        ),
      );
    }

    const rows = await this.db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        imageKey: comments.imageKey,
        likeCount: comments.likeCount,
        replyCount: comments.replyCount,
        createdAt: comments.createdAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(limit + 1);

    return rows;
  }
}
