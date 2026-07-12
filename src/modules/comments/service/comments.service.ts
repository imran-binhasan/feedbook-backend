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
  CursorValue,
} from '../../../infrastructure/database/repositories/comment.repository';
import { PostRepository } from '../../../infrastructure/database/repositories/post.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository,
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
      await this.storageService.delete(comment.imageKey);
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

    const limit = this.parseLimit(limitStr);
    const cursor = this.decodeCursor(cursorStr);

    const rows = await this.commentRepository.getByPost(postId, cursor, limit);

    return this.paginate(rows, limit);
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

  private parseLimit(limitStr?: string): number {
    if (!limitStr) return 10;
    const n = parseInt(limitStr, 10);
    if (isNaN(n) || n < 1) return 10;
    return Math.min(n, 50);
  }

  private decodeCursor(s?: string): CursorValue | null {
    if (!s) return null;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
    if (typeof raw.createdAt === 'string' && typeof raw.id === 'string') {
      return { createdAt: new Date(raw.createdAt), id: raw.id };
    }
    throw new BadRequestException('Invalid cursor');
  }

  private encodeCursor(item: { createdAt: Date; id: string }): string {
    return Buffer.from(
      JSON.stringify({
        createdAt: item.createdAt.toISOString(),
        id: item.id,
      }),
    ).toString('base64url');
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
      nextCursor:
        hasMore ? this.encodeCursor(rows[rows.length - 1]) : null,
      hasMore,
    };
  }
}