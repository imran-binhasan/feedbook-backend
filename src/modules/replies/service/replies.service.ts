import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ReplyRepository } from '../../../infrastructure/database/repositories/reply.repository';
import { CommentRepository } from '../../../infrastructure/database/repositories/comment.repository';
import { LikeRepository } from '../../../infrastructure/database/repositories/like.repository';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { UpdateReplyDto } from '../dto/update-reply.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';
import type { ReplyRow } from '../../../infrastructure/database/repositories/reply.repository';
import {
  decodeCursor,
  paginate,
  parseLimit,
} from '../../../common/utils/cursor-pagination.util';

@Injectable()
export class RepliesService {
  constructor(
    private readonly replyRepository: ReplyRepository,
    private readonly commentRepository: CommentRepository,
    private readonly likeRepository: LikeRepository,
  ) {}

  async create(
    user: CurrentUserPayload,
    commentId: string,
    dto: CreateReplyDto,
  ): Promise<ReplyResponse> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const reply = await this.replyRepository.create({
      commentId,
      userId: user.userId,
      content: dto.content,
    });

    await this.commentRepository.adjustReplyCount(commentId, 1);

    return this.toResponse(reply);
  }

  async update(
    user: CurrentUserPayload,
    id: string,
    dto: UpdateReplyDto,
  ): Promise<ReplyResponse> {
    const reply = await this.replyRepository.findById(id);
    if (!reply) throw new NotFoundException('Reply not found');
    if (reply.userId !== user.userId) {
      throw new ForbiddenException('You can only update your own replies');
    }

    const updated = await this.replyRepository.update(id, {
      content: dto.content,
    });

    return this.toResponse(updated!);
  }

  async remove(user: CurrentUserPayload, id: string): Promise<void> {
    const reply = await this.replyRepository.findById(id);
    if (!reply) throw new NotFoundException('Reply not found');
    if (reply.userId !== user.userId) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    await this.replyRepository.delete(id);
    await this.commentRepository.adjustReplyCount(reply.commentId, -1);
  }

  async getByComment(
    user: CurrentUserPayload,
    commentId: string,
    cursor?: string,
    limit?: string,
  ): Promise<CursorPaginatedResult<ReplyResponseWithAuthor>> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const parsedLimit = parseLimit(limit);
    const parsedCursor = decodeCursor(cursor);

    const rows = await this.replyRepository.getByComment(
      commentId,
      parsedCursor,
      parsedLimit,
    );

    const items = rows.map((r) => this.toAuthorResponse(r));
    const result = paginate(items, parsedLimit);
    const replyIds = result.items.map((r) => r.id);
    const likedIds = await this.likeRepository.getUserLikedReplyIds(
      user.userId,
      replyIds,
    );
    return {
      ...result,
      items: result.items.map((r) => ({ ...r, hasLiked: likedIds.has(r.id) })),
    };
  }

  private toResponse(reply: ReplyRow): ReplyResponse {
    return {
      id: reply.id,
      commentId: reply.commentId,
      userId: reply.userId,
      content: reply.content,
      likeCount: reply.likeCount,
      createdAt: reply.createdAt,
    };
  }

  private toAuthorResponse(
    reply: ReplyRow & {
      authorId: string;
      authorFirstName: string;
      authorLastName: string;
    },
  ): ReplyResponseWithAuthor {
    return {
      id: reply.id,
      commentId: reply.commentId,
      userId: reply.userId,
      content: reply.content,
      likeCount: reply.likeCount,
      createdAt: reply.createdAt,
      author: {
        id: reply.authorId,
        firstName: reply.authorFirstName,
        lastName: reply.authorLastName,
      },
    };
  }
}

export interface ReplyResponse {
  id: string;
  commentId: string;
  userId: string;
  content: string | null;
  likeCount: number;
  createdAt: Date;
}

export interface ReplyResponseWithAuthor extends ReplyResponse {
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
