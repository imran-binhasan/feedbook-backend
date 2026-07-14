import { Inject, Injectable } from '@nestjs/common';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database-connection';
import type { DrizzleDB } from '../database-connection';
import { posts, users } from '../schema';

export interface CreatePostRecord {
  userId: string;
  content?: string | null;
  imageKey?: string | null;
  isPublic?: boolean | null;
}

export interface UpdatePostRecord {
  content?: string | null;
  imageKey?: string | null;
  isPublic?: boolean | null;
}

export interface PostRow {
  id: string;
  userId: string;
  content: string | null;
  imageKey: string | null;
  likeCount: number;
  commentCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostWithAuthorRow extends PostRow {
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
}

export interface CursorValue {
  createdAt: Date;
  id: string;
}

@Injectable()
export class PostRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findById(id: string): Promise<PostRow | null> {
    const [row] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByIdWithAuthor(id: string): Promise<PostWithAuthorRow | null> {
    const [row] = await this.db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
imageKey: posts.imageKey,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      isPublic: posts.isPublic,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: users.id,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

    return row ?? null;
  }

  async create(data: CreatePostRecord): Promise<PostRow> {
    const [row] = await this.db
      .insert(posts)
      .values({
        userId: data.userId,
        content: data.content ?? null,
        imageKey: data.imageKey ?? null,
        isPublic: data.isPublic ?? true,
      })
      .returning();

    return row;
  }

  async update(id: string, data: UpdatePostRecord): Promise<PostRow | null> {
    const setValues: Record<string, unknown> = { updatedAt: new Date() };

    if (data.content !== undefined) {
      setValues.content = data.content;
    }
    if (data.imageKey !== undefined) {
      setValues.imageKey = data.imageKey;
    }
    if (data.isPublic !== undefined) {
      setValues.isPublic = data.isPublic;
    }

    const [row] = await this.db
      .update(posts)
      .set(setValues)
      .where(eq(posts.id, id))
      .returning();

    return row ?? null;
  }

  async adjustCommentCount(id: string, delta: 1 | -1): Promise<void> {
    await this.db
      .update(posts)
      .set({ commentCount: sql`GREATEST(${posts.commentCount} + ${delta}, 0)` })
      .where(eq(posts.id, id));
  }

  async adjustLikeCount(id: string, delta: 1 | -1): Promise<void> {
    await this.db
      .update(posts)
      .set({ likeCount: sql`GREATEST(${posts.likeCount} + ${delta}, 0)` })
      .where(eq(posts.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(posts).where(eq(posts.id, id));
  }

  private cursorWhere(
    field: { createdAt: typeof posts.createdAt; id: typeof posts.id },
    cursor: CursorValue | null,
  ) {
    if (!cursor) return undefined;
    return sql`(${field.createdAt}, ${field.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`;
  }

  async getFeed(
    cursor: CursorValue | null,
    limit: number,
    currentUserId?: string,
  ): Promise<PostWithAuthorRow[]> {
    limit = Math.min(limit, 100);
    const visibilityCondition = currentUserId
      ? or(eq(posts.isPublic, true), eq(posts.userId, currentUserId))
      : eq(posts.isPublic, true);

    const rows = await this.db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageKey: posts.imageKey,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        isPublic: posts.isPublic,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(
        and(
          visibilityCondition,
          this.cursorWhere(
            { createdAt: posts.createdAt, id: posts.id },
            cursor,
          ),
        ),
      )
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1);

    return rows;
  }

  async getAuthorPosts(
    userId: string,
    cursor: CursorValue | null,
    limit: number,
    includePrivate: boolean,
  ): Promise<PostWithAuthorRow[]> {
    limit = Math.min(limit, 100);
    const conditions = [eq(posts.userId, userId)];

    if (!includePrivate) {
      conditions.push(eq(posts.isPublic, true));
    }

    const cursorCondition = this.cursorWhere(
      { createdAt: posts.createdAt, id: posts.id },
      cursor,
    );
    if (cursorCondition) {
      conditions.push(cursorCondition);
    }

    const rows = await this.db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageKey: posts.imageKey,
        likeCount: posts.likeCount,
        commentCount: posts.commentCount,
        isPublic: posts.isPublic,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit + 1);

    return rows;
  }
}
