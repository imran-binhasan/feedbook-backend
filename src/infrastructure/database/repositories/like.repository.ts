import { Inject, Injectable } from '@nestjs/common';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
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
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(postLikes)
        .values({ postId, userId })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        await adjustCounter(1);
        return { liked: true };
      }

      await tx
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      await adjustCounter(-1);
      return { liked: false };
    });
  }

  async toggleComment(
    commentId: string,
    userId: string,
    adjustCounter: (delta: 1 | -1) => Promise<void>,
  ): Promise<{ liked: boolean }> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(commentLikes)
        .values({ commentId, userId })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        await adjustCounter(1);
        return { liked: true };
      }

      await tx
        .delete(commentLikes)
        .where(
          and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.userId, userId),
          ),
        );
      await adjustCounter(-1);
      return { liked: false };
    });
  }

  async toggleReply(
    replyId: string,
    userId: string,
    adjustCounter: (delta: 1 | -1) => Promise<void>,
  ): Promise<{ liked: boolean }> {
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(replyLikes)
        .values({ replyId, userId })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        await adjustCounter(1);
        return { liked: true };
      }

      await tx
        .delete(replyLikes)
        .where(
          and(eq(replyLikes.replyId, replyId), eq(replyLikes.userId, userId)),
        );
      await adjustCounter(-1);
      return { liked: false };
    });
  }

  async getUserLikedPostIds(
    userId: string,
    postIds: string[],
  ): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();
    const rows = await this.db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          inArray(postLikes.postId, postIds),
        ),
      );
    return new Set(rows.map((r) => r.postId));
  }

  async getUserLikedCommentIds(
    userId: string,
    commentIds: string[],
  ): Promise<Set<string>> {
    if (commentIds.length === 0) return new Set();
    const rows = await this.db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, userId),
          inArray(commentLikes.commentId, commentIds),
        ),
      );
    return new Set(rows.map((r) => r.commentId));
  }

  async getUserLikedReplyIds(
    userId: string,
    replyIds: string[],
  ): Promise<Set<string>> {
    if (replyIds.length === 0) return new Set();
    const rows = await this.db
      .select({ replyId: replyLikes.replyId })
      .from(replyLikes)
      .where(
        and(
          eq(replyLikes.userId, userId),
          inArray(replyLikes.replyId, replyIds),
        ),
      );
    return new Set(rows.map((r) => r.replyId));
  }

  async getTopLikersForPosts(
    postIds: string[],
    topN: number,
  ): Promise<Map<string, LikeWithAuthorRow[]>> {
    const result = new Map<string, LikeWithAuthorRow[]>();
    if (postIds.length === 0) return result;

    const batches = await Promise.all(
      postIds.map((postId) =>
        this.db
          .select({
            userId: postLikes.userId,
            postId: postLikes.postId,
            createdAt: postLikes.createdAt,
            authorId: users.id,
            authorFirstName: users.firstName,
            authorLastName: users.lastName,
          })
          .from(postLikes)
          .innerJoin(users, eq(postLikes.userId, users.id))
          .where(eq(postLikes.postId, postId))
          .orderBy(desc(postLikes.createdAt))
          .limit(topN),
      ),
    );

    for (let i = 0; i < postIds.length; i++) {
      if (batches[i].length > 0) {
        result.set(postIds[i], batches[i]);
      }
    }

    return result;
  }

  async getPostLikers(
    postId: string,
    cursor: CursorValue | null,
    limit: number,
  ): Promise<LikeWithAuthorRow[]> {
    limit = Math.min(limit, 100);
    const conditions = [eq(postLikes.postId, postId)];
    if (cursor) {
      conditions.push(
        sql`(${postLikes.createdAt}, ${postLikes.userId}) < (${cursor.createdAt}::timestamptz, ${cursor.userId}::uuid)`,
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
    limit = Math.min(limit, 100);
    const conditions = [eq(commentLikes.commentId, commentId)];
    if (cursor) {
      conditions.push(
        sql`(${commentLikes.createdAt}, ${commentLikes.userId}) < (${cursor.createdAt}::timestamptz, ${cursor.userId}::uuid)`,
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
    limit = Math.min(limit, 100);
    const conditions = [eq(replyLikes.replyId, replyId)];
    if (cursor) {
      conditions.push(
        sql`(${replyLikes.createdAt}, ${replyLikes.userId}) < (${cursor.createdAt}::timestamptz, ${cursor.userId}::uuid)`,
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
