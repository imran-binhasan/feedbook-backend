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
} from '../../../infrastructure/database/repositories/post.repository';
import { CommentRepository } from '../../../infrastructure/database/repositories/comment.repository';
import { LikeRepository } from '../../../infrastructure/database/repositories/like.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';
import type { CursorPaginatedResult } from '../../../common/interface/api-response.interface';
import {
  decodeCursor,
  parseLimit,
  paginate,
} from '../../../common/utils/cursor-pagination.util';

const POST_CACHE_TTL = 300;
const TOP_LIKERS_PER_POST = 5;

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

    const [likedIds, topLikersByPost] = await Promise.all([
      this.likeRepository.getUserLikedPostIds(user.userId, [post.id]),
      this.likeRepository.getTopLikersForPosts([post.id], TOP_LIKERS_PER_POST),
    ]);

    const response = {
      ...this.toFeedItemResponse(post),
      hasLiked: likedIds.has(post.id),
      likers: (topLikersByPost.get(post.id) ?? []).map((l) => ({
        userId: l.userId,
        author: { id: l.userId, firstName: l.authorFirstName, lastName: l.authorLastName },
      })),
    };
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
    const limit = parseLimit(limitStr);
    const cursor = decodeCursor(cursorStr);

    const rows = await this.postRepository.getFeed(cursor, limit, user.userId);
    const items = rows.map((r) => this.toFeedItemResponse(r));

    return this.enrichWithLikes(user.userId, paginate(items, limit));
  }

  private async enrichWithLikes(
    userId: string,
    result: CursorPaginatedResult<ReturnType<typeof this.toFeedItemResponse>>,
  ) {
    const postIds = result.items.map((p) => p.id);
    const [likedIds, topLikersByPost] = await Promise.all([
      this.likeRepository.getUserLikedPostIds(userId, postIds),
      this.likeRepository.getTopLikersForPosts(postIds, TOP_LIKERS_PER_POST),
    ]);
    return {
      ...result,
      items: result.items.map((p) => ({
        ...p,
        hasLiked: likedIds.has(p.id),
        likers: (topLikersByPost.get(p.id) ?? []).map((l) => ({
          userId: l.userId,
          author: {
            id: l.userId,
            firstName: l.authorFirstName,
            lastName: l.authorLastName,
          },
        })),
      })),
    };
  }

  async getUserPosts(
    user: CurrentUserPayload,
    targetUserId: string,
    cursorStr?: string,
    limitStr?: string,
  ) {
    const limit = parseLimit(limitStr);
    const cursor = decodeCursor(cursorStr);
    const includePrivate = targetUserId === user.userId;

    const rows = await this.postRepository.getAuthorPosts(
      targetUserId,
      cursor,
      limit,
      includePrivate,
    );
    const items = rows.map((r) => this.toFeedItemResponse(r));

    return this.enrichWithLikes(user.userId, paginate(items, limit));
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
}
