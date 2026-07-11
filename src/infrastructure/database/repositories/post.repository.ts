import { Inject, Injectable } from '@nestjs/common';
import { eq, lt, or, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database-connection';
import type { DrizzleDB } from '../database-connection';
import { posts, users } from '../schema';

export interface CreatePostRecord {
  userId: string;
  content?: string | null;
  imageUrl?: string | null;
  isPublic?: boolean | null;
}

export interface UpdatePostRecord {
  content?: string | null;
  imageUrl?: string | null;
  isPublic?: boolean | null;
}

export interface PostRow {
  id: string;
  userId: string;
  content: string | null;
  imageUrl: string | null;
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
        imageUrl: posts.imageUrl,
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
        imageUrl: data.imageUrl ?? null,
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
    if (data.imageUrl !== undefined) {
      setValues.imageUrl = data.imageUrl;
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

  async incrementCommentCount(id: string): Promise<void> {
    await this.db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, id));
  }

  async decrementCommentCount(id: string): Promise<void> {
    await this.db
      .update(posts)
      .set({ commentCount: sql`${posts.commentCount} - 1` })
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
    return or(
      lt(field.createdAt, cursor.createdAt),
      and(eq(field.createdAt, cursor.createdAt), lt(field.id, cursor.id)),
    );
  }

  async getFeed(
    cursor: CursorValue | null,
    limit: number,
  ): Promise<PostWithAuthorRow[]> {
    const rows = await this.db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
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
          eq(posts.isPublic, true),
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
        imageUrl: posts.imageUrl,
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
