import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ReplyRepository } from '../../../infrastructure/database/repositories/reply.repository';
import { CommentRepository } from '../../../infrastructure/database/repositories/comment.repository';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { UpdateReplyDto } from '../dto/update-reply.dto';
import type {
  CurrentUserPayload,
  UserProfile,
} from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';
import type { ReplyRow } from '../../../infrastructure/database/repositories/reply.repository';

@Injectable()
export class RepliesService {
  constructor(
    private readonly replyRepository: ReplyRepository,
    private readonly commentRepository: CommentRepository,
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
    commentId: string,
    cursor?: string,
    limit?: string,
  ): Promise<CursorPaginatedResult<ReplyResponseWithAuthor>> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const parsedLimit = Math.min(
      Math.max(parseInt(limit ?? '20', 10) || 20, 1),
      100,
    );
    const parsedCursor = cursor ? this.decodeCursor(cursor) : null;

    const rows = await this.replyRepository.getByComment(
      commentId,
      parsedCursor,
      parsedLimit,
    );

    return this.paginate(rows, parsedLimit);
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

  private encodeCursor(value: { createdAt: Date; id: string }): string {
    return Buffer.from(
      JSON.stringify({ createdAt: value.createdAt, id: value.id }),
    ).toString('base64url');
  }

  private decodeCursor(
    cursor: string,
  ): { createdAt: Date; id: string } {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  }

  private paginate(
    rows: (ReplyRow & {
      authorId: string;
      authorFirstName: string;
      authorLastName: string;
    })[],
    limit: number,
  ): CursorPaginatedResult<ReplyResponseWithAuthor> {
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const items = rows.map((r) => this.toAuthorResponse(r));

    return {
      items,
      nextCursor: hasMore ? this.encodeCursor(rows[rows.length - 1]) : null,
      hasMore,
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
