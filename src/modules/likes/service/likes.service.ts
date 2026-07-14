import { Injectable, NotFoundException } from '@nestjs/common';
import { LikeRepository } from '../../../infrastructure/database/repositories/like.repository';
import { PostRepository } from '../../../infrastructure/database/repositories/post.repository';
import { CommentRepository } from '../../../infrastructure/database/repositories/comment.repository';
import { ReplyRepository } from '../../../infrastructure/database/repositories/reply.repository';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';
import {
  decodeLikeCursor,
  encodeLikeCursor,
  parseLimit,
} from '../../../common/utils/cursor-pagination.util';

@Injectable()
export class LikesService {
  constructor(
    private readonly likeRepository: LikeRepository,
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly replyRepository: ReplyRepository,
  ) {}

  async togglePost(
    user: CurrentUserPayload,
    postId: string,
  ): Promise<{ liked: boolean }> {
    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (!post.isPublic && post.userId !== user.userId) {
      throw new NotFoundException('Post not found');
    }

    return this.likeRepository.togglePost(postId, user.userId, (delta) =>
      this.postRepository.adjustLikeCount(postId, delta),
    );
  }

  async toggleComment(
    user: CurrentUserPayload,
    commentId: string,
  ): Promise<{ liked: boolean }> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const post = await this.postRepository.findById(comment.postId);
    if (!post || (!post.isPublic && post.userId !== user.userId)) {
      throw new NotFoundException('Comment not found');
    }

    return this.likeRepository.toggleComment(commentId, user.userId, (delta) =>
      this.commentRepository.adjustLikeCount(commentId, delta),
    );
  }

  async toggleReply(
    user: CurrentUserPayload,
    replyId: string,
  ): Promise<{ liked: boolean }> {
    const reply = await this.replyRepository.findById(replyId);
    if (!reply) throw new NotFoundException('Reply not found');

    const comment = await this.commentRepository.findById(reply.commentId);
    if (!comment) throw new NotFoundException('Reply not found');

    const post = await this.postRepository.findById(comment.postId);
    if (!post || (!post.isPublic && post.userId !== user.userId)) {
      throw new NotFoundException('Reply not found');
    }

    return this.likeRepository.toggleReply(replyId, user.userId, (delta) =>
      this.replyRepository.adjustLikeCount(replyId, delta),
    );
  }

  async getPostLikers(
    user: CurrentUserPayload,
    postId: string,
    cursor?: string,
    limit?: string,
  ): Promise<
    CursorPaginatedResult<{
      userId: string;
      createdAt: Date;
      author: { id: string; firstName: string; lastName: string };
    }>
  > {
    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    if (!post.isPublic && post.userId !== user.userId) {
      throw new NotFoundException('Post not found');
    }

    const parsedLimit = parseLimit(limit);
    const parsedCursor = cursor ? decodeLikeCursor(cursor) : null;

    const rows = await this.likeRepository.getPostLikers(
      postId,
      parsedCursor,
      parsedLimit,
    );

    return this.paginate(rows, parsedLimit);
  }

  async getCommentLikers(
    user: CurrentUserPayload,
    commentId: string,
    cursor?: string,
    limit?: string,
  ): Promise<
    CursorPaginatedResult<{
      userId: string;
      createdAt: Date;
      author: { id: string; firstName: string; lastName: string };
    }>
  > {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const post = await this.postRepository.findById(comment.postId);
    if (!post || (!post.isPublic && post.userId !== user.userId)) {
      throw new NotFoundException('Comment not found');
    }

    const parsedLimit = parseLimit(limit);
    const parsedCursor = cursor ? decodeLikeCursor(cursor) : null;

    const rows = await this.likeRepository.getCommentLikers(
      commentId,
      parsedCursor,
      parsedLimit,
    );

    return this.paginate(rows, parsedLimit);
  }

  async getReplyLikers(
    user: CurrentUserPayload,
    replyId: string,
    cursor?: string,
    limit?: string,
  ): Promise<
    CursorPaginatedResult<{
      userId: string;
      createdAt: Date;
      author: { id: string; firstName: string; lastName: string };
    }>
  > {
    const reply = await this.replyRepository.findById(replyId);
    if (!reply) throw new NotFoundException('Reply not found');

    const comment = await this.commentRepository.findById(reply.commentId);
    if (!comment) throw new NotFoundException('Reply not found');

    const post = await this.postRepository.findById(comment.postId);
    if (!post || (!post.isPublic && post.userId !== user.userId)) {
      throw new NotFoundException('Reply not found');
    }

    const parsedLimit = parseLimit(limit);
    const parsedCursor = cursor ? decodeLikeCursor(cursor) : null;

    const rows = await this.likeRepository.getReplyLikers(
      replyId,
      parsedCursor,
      parsedLimit,
    );

    return this.paginate(rows, parsedLimit);
  }

  private paginate(
    rows: {
      userId: string;
      createdAt: Date;
      authorId: string;
      authorFirstName: string;
      authorLastName: string;
    }[],
    limit: number,
  ) {
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const items = rows.map((r) => ({
      userId: r.userId,
      createdAt: r.createdAt,
      author: {
        id: r.authorId,
        firstName: r.authorFirstName,
        lastName: r.authorLastName,
      },
    }));

    return {
      items,
      nextCursor: hasMore ? encodeLikeCursor(rows[rows.length - 1]) : null,
      hasMore,
    };
  }
}
