import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostRepository } from '../../../infrastructure/database/repositories/post.repository';
import type {
  PostRow,
  PostWithAuthorRow,
  CursorValue,
} from '../../../infrastructure/database/repositories/post.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';

@Injectable()
export class PostsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly storageService: StorageService,
  ) {}

  async uploadImage(
    user: CurrentUserPayload,
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    const key = this.storageService.buildKey(
      'posts',
      user.userId,
      file.mimetype,
    );
    return this.storageService.upload(key, file.buffer, file.mimetype);
  }

  async create(user: CurrentUserPayload, dto: CreatePostDto) {
    if (!dto.content && !dto.imageKey) {
      throw new BadRequestException('Post must have content or an image');
    }

    const post = await this.postRepository.create({
      userId: user.userId,
      content: dto.content ?? null,
      imageUrl: dto.imageKey ?? null,
      isPublic: dto.isPublic ?? true,
    });

    return this.toPostResponse(post);
  }

  async findById(user: CurrentUserPayload, id: string) {
    const post = await this.postRepository.findByIdWithAuthor(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.isPublic && post.userId !== user.userId) {
      throw new NotFoundException('Post not found');
    }

    return this.toFeedItemResponse(post);
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdatePostDto) {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== user.userId) {
      throw new ForbiddenException('You do not own this post');
    }

    if (
      dto.imageKey !== undefined &&
      dto.imageKey !== post.imageUrl &&
      post.imageUrl
    ) {
      this.storageService.delete(post.imageUrl).catch(() => {});
    }

    const updated = await this.postRepository.update(id, {
      content: dto.content,
      imageUrl: dto.imageKey,
      isPublic: dto.isPublic,
    });

    return this.toPostResponse(updated!);
  }

  async remove(user: CurrentUserPayload, id: string): Promise<void> {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== user.userId) {
      throw new ForbiddenException('You do not own this post');
    }

    await this.postRepository.delete(id);

    if (post.imageUrl) {
      await this.storageService.delete(post.imageUrl);
    }
  }

  async getFeed(
    _user: CurrentUserPayload,
    cursorStr?: string,
    limitStr?: string,
  ) {
    const limit = this.parseLimit(limitStr);
    const cursor = this.decodeCursor(cursorStr);

    const rows = await this.postRepository.getFeed(cursor, limit);

    return this.paginate(rows, limit);
  }

  async getUserPosts(
    user: CurrentUserPayload,
    targetUserId: string,
    cursorStr?: string,
    limitStr?: string,
  ) {
    const limit = this.parseLimit(limitStr);
    const cursor = this.decodeCursor(cursorStr);
    const includePrivate = targetUserId === user.userId;

    const rows = await this.postRepository.getAuthorPosts(
      targetUserId,
      cursor,
      limit,
      includePrivate,
    );

    return this.paginate(rows, limit);
  }

  private toPostResponse(post: PostRow) {
    return {
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: this.storageService.getPublicUrl(post.imageUrl),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private toFeedItemResponse(post: PostWithAuthorRow) {
    return {
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: this.storageService.getPublicUrl(post.imageUrl),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.authorId,
        firstName: post.authorFirstName,
        lastName: post.authorLastName,
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

  private paginate<T extends { createdAt: Date; id: string }>(
    rows: T[],
    limit: number,
  ): CursorPaginatedResult<ReturnType<typeof this.toFeedItemResponse>> {
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const items = rows.map((r) =>
      this.toFeedItemResponse(r as unknown as PostWithAuthorRow),
    );

    return {
      items,
      nextCursor:
        items.length > 0 ? this.encodeCursor(rows[rows.length - 1]) : null,
      hasMore,
    };
  }
}
