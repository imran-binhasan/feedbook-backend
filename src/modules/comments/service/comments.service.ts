import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentRepository } from '../../../infrastructure/database/repositories/comment.repository';
import type {
  CommentRow,
  CommentWithAuthorRow,
} from '../../../infrastructure/database/repositories/comment.repository';
import { PostRepository } from '../../../infrastructure/database/repositories/post.repository';
import { LikeRepository } from '../../../infrastructure/database/repositories/like.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';
import {
  decodeCursor,
  encodeCursor,
  parseLimit,
} from '../../../common/utils/cursor-pagination.util';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository,
    private readonly likeRepository: LikeRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(
    user: CurrentUserPayload,
    postId: string,
    dto: CreateCommentDto,
  ) {
    if (!dto.content && !dto.imageKey) {
      throw new BadRequestException('Comment must have content or an image');
    }

    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (!post.isPublic && post.userId !== user.userId) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.commentRepository.create({
      postId,
      userId: user.userId,
      content: dto.content ?? null,
      imageKey: dto.imageKey ?? null,
    });

    await this.postRepository.adjustCommentCount(postId, 1);

    return this.toCommentResponse(comment);
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdateCommentDto) {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== user.userId) {
      throw new ForbiddenException('You do not own this comment');
    }

    if (
      dto.imageKey !== undefined &&
      dto.imageKey !== comment.imageKey &&
      comment.imageKey
    ) {
      this.storageService.delete(comment.imageKey).catch(() => {});
    }

    const updated = await this.commentRepository.update(id, {
      content: dto.content,
      imageKey: dto.imageKey,
    });

    return this.toCommentResponse(updated!);
  }

  async remove(user: CurrentUserPayload, id: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== user.userId) {
      throw new ForbiddenException('You do not own this comment');
    }

    await this.commentRepository.delete(id);
    await this.postRepository.adjustCommentCount(comment.postId, -1);

    if (comment.imageKey) {
      this.storageService.delete(comment.imageKey).catch(() => {});
    }
  }

  async getByPost(
    user: CurrentUserPayload,
    postId: string,
    cursorStr?: string,
    limitStr?: string,
  ) {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (!post.isPublic && post.userId !== user.userId) {
      throw new NotFoundException('Post not found');
    }

    const limit = parseLimit(limitStr);
    const cursor = decodeCursor(cursorStr);

    const rows = await this.commentRepository.getByPost(postId, cursor, limit);
    const result = this.paginate(rows, limit);

    const commentIds = result.items.map((c) => c.id);
    const likedIds = await this.likeRepository.getUserLikedCommentIds(
      user.userId,
      commentIds,
    );
    return {
      ...result,
      items: result.items.map((c) => ({ ...c, hasLiked: likedIds.has(c.id) })),
    };
  }

  private toCommentResponse(comment: CommentRow) {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      imageUrl: this.storageService.getPublicUrl(comment.imageKey),
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
    };
  }

  private toFeedItemResponse(comment: CommentWithAuthorRow) {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      content: comment.content,
      imageUrl: this.storageService.getPublicUrl(comment.imageKey),
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
      author: {
        id: comment.authorId,
        firstName: comment.authorFirstName,
        lastName: comment.authorLastName,
      },
    };
  }

  private paginate(
    rows: CommentWithAuthorRow[],
    limit: number,
  ): CursorPaginatedResult<ReturnType<typeof this.toFeedItemResponse>> {
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const items = rows.map((r) => this.toFeedItemResponse(r));

    return {
      items,
      nextCursor: hasMore ? encodeCursor(rows[rows.length - 1]) : null,
      hasMore,
    };
  }
}
