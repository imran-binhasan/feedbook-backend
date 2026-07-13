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
import { CommentRepository } from '../../../infrastructure/database/repositories/comment.repository';
import { LikeRepository } from '../../../infrastructure/database/repositories/like.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';

const POST_CACHE_TTL = 300;

@Injectable()
export class PostsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly likeRepository: LikeRepository,
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreatePostDto) {
    if (!dto.content && !dto.imageKey) {
      throw new BadRequestException('Post must have content or an image');
    }

    const post = await this.postRepository.create({
      userId: user.userId,
      content: dto.content ?? null,
      imageKey: dto.imageKey ?? null,
      isPublic: dto.isPublic ?? true,
    });

    return this.toPostResponse(post);
  }

  async findById(user: CurrentUserPayload, id: string) {
    const cacheKey = `post:${id}`;

    const cached = await this.cacheService.get<ReturnType<typeof this.toFeedItemResponse>>(cacheKey);
    if (cached) return cached;

    const post = await this.postRepository.findByIdWithAuthor(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.isPublic && post.userId !== user.userId) {
      throw new NotFoundException('Post not found');
    }

    const response = this.toFeedItemResponse(post);
    await this.cacheService.set(cacheKey, response, POST_CACHE_TTL);

    return response;
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
      dto.imageKey !== post.imageKey &&
      post.imageKey
    ) {
      this.storageService.delete(post.imageKey).catch(() => {});
    }

    const updated = await this.postRepository.update(id, {
      content: dto.content,
      imageKey: dto.imageKey,
      isPublic: dto.isPublic,
    });

    this.cacheService.del(`post:${id}`).catch(() => {});

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

    const commentImageKeys = await this.commentRepository.findCommentImageKeysByPost(id);
    const allImageKeys = [post.imageKey, ...commentImageKeys].filter(Boolean) as string[];

    await this.postRepository.delete(id);

    for (const key of allImageKeys) {
      this.storageService.delete(key).catch(() => {});
    }

    this.cacheService.del(`post:${id}`).catch(() => {});
  }

  async getFeed(
    user: CurrentUserPayload,
    cursorStr?: string,
    limitStr?: string,
  ) {
    const limit = this.parseLimit(limitStr);
    const cursor = this.decodeCursor(cursorStr);

    const rows = await this.postRepository.getFeed(cursor, limit);

    return this.enrichWithLikes(user.userId, this.paginate(rows, limit));
  }

  private async enrichWithLikes(
    userId: string,
    result: CursorPaginatedResult<ReturnType<typeof this.toFeedItemResponse>>,
  ) {
    const postIds = result.items.map((p) => p.id);
    const likedIds = await this.likeRepository.getUserLikedPostIds(userId, postIds);
    return {
      ...result,
      items: result.items.map((p) => ({ ...p, hasLiked: likedIds.has(p.id) })),
    };
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

    return this.enrichWithLikes(user.userId, this.paginate(rows, limit));
  }

  private toPostResponse(post: PostRow) {
    return {
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrl: this.storageService.getPublicUrl(post.imageKey),
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
      imageUrl: this.storageService.getPublicUrl(post.imageKey),
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
        hasMore ? this.encodeCursor(rows[rows.length - 1]) : null,
      hasMore,
    };
  }
}
