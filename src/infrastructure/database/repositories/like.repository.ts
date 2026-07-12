import { Inject, Injectable } from '@nestjs/common';
import { eq, and, or, desc, lt } from 'drizzle-orm';
import { DRIZZLE } from '../database-connection';
import type { DrizzleDB } from '../database-connection';
import { postLikes, commentLikes, replyLikes, users } from '../schema';

export interface LikeWithAuthorRow {
  userId: string;
  createdAt: Date;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
}

export interface CursorValue {
  createdAt: Date;
  userId: string;
}

@Injectable()
export class LikeRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async togglePost(
    postId: string,
    userId: string,
    adjustCounter: (delta: 1 | -1) => Promise<void>,
  ): Promise<{ liked: boolean }> {
    const [existing] = await this.db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .limit(1);

    if (existing) {
      await this.db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      await adjustCounter(-1);
      return { liked: false };
    }

    await this.db.insert(postLikes).values({ postId, userId });
    await adjustCounter(1);
    return { liked: true };
  }

  async toggleComment(
    commentId: string,
    userId: string,
    adjustCounter: (delta: 1 | -1) => Promise<void>,
  ): Promise<{ liked: boolean }> {
    const [existing] = await this.db
      .select()
      .from(commentLikes)
      .where(
        and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.userId, userId),
          ),
        );
      await adjustCounter(-1);
      return { liked: false };
    }

    await this.db.insert(commentLikes).values({ commentId, userId });
    await adjustCounter(1);
    return { liked: true };
  }

  async toggleReply(
    replyId: string,
    userId: string,
    adjustCounter: (delta: 1 | -1) => Promise<void>,
  ): Promise<{ liked: boolean }> {
    const [existing] = await this.db
      .select()
      .from(replyLikes)
      .where(
        and(eq(replyLikes.replyId, replyId), eq(replyLikes.userId, userId)),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(replyLikes)
        .where(
          and(
            eq(replyLikes.replyId, replyId),
            eq(replyLikes.userId, userId),
          ),
        );
      await adjustCounter(-1);
      return { liked: false };
    }

    await this.db.insert(replyLikes).values({ replyId, userId });
    await adjustCounter(1);
    return { liked: true };
  }

  async getPostLikers(
    postId: string,
    cursor: CursorValue | null,
    limit: number,
  ): Promise<LikeWithAuthorRow[]> {
    const conditions = [eq(postLikes.postId, postId)];
    if (cursor) {
      conditions.push(
        or(
          lt(postLikes.createdAt, cursor.createdAt),
          and(
            eq(postLikes.createdAt, cursor.createdAt),
            lt(postLikes.userId, cursor.userId),
          )!,
        )!,
      );
    }

    return this.db
      .select({
        userId: postLikes.userId,
        createdAt: postLikes.createdAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(postLikes)
      .innerJoin(users, eq(postLikes.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(postLikes.createdAt), desc(postLikes.userId))
      .limit(limit + 1);
  }

  async getCommentLikers(
    commentId: string,
    cursor: CursorValue | null,
    limit: number,
  ): Promise<LikeWithAuthorRow[]> {
    const conditions = [eq(commentLikes.commentId, commentId)];
    if (cursor) {
      conditions.push(
        or(
          lt(commentLikes.createdAt, cursor.createdAt),
          and(
            eq(commentLikes.createdAt, cursor.createdAt),
            lt(commentLikes.userId, cursor.userId),
          )!,
        )!,
      );
    }

    return this.db
      .select({
        userId: commentLikes.userId,
        createdAt: commentLikes.createdAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(commentLikes)
      .innerJoin(users, eq(commentLikes.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(commentLikes.createdAt), desc(commentLikes.userId))
      .limit(limit + 1);
  }

  async getReplyLikers(
    replyId: string,
    cursor: CursorValue | null,
    limit: number,
  ): Promise<LikeWithAuthorRow[]> {
    const conditions = [eq(replyLikes.replyId, replyId)];
    if (cursor) {
      conditions.push(
        or(
          lt(replyLikes.createdAt, cursor.createdAt),
          and(
            eq(replyLikes.createdAt, cursor.createdAt),
            lt(replyLikes.userId, cursor.userId),
          )!,
        )!,
      );
    }

    return this.db
      .select({
        userId: replyLikes.userId,
        createdAt: replyLikes.createdAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(replyLikes)
      .innerJoin(users, eq(replyLikes.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(replyLikes.createdAt), desc(replyLikes.userId))
      .limit(limit + 1);
  }
}
