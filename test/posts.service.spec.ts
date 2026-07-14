import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from '../src/modules/posts/service/posts.service';
import { PostRepository } from '../src/infrastructure/database/repositories/post.repository';
import { CommentRepository } from '../src/infrastructure/database/repositories/comment.repository';
import { LikeRepository } from '../src/infrastructure/database/repositories/like.repository';
import { StorageService } from '../src/infrastructure/storage/storage.service';
import { CacheService } from '../src/infrastructure/cache/cache.service';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: jest.Mocked<PostRepository>;
  let commentRepo: jest.Mocked<CommentRepository>;
  let likeRepo: jest.Mocked<LikeRepository>;
  let cache: jest.Mocked<CacheService>;

  const mockUser = { userId: 'uid', email: 'a@b.com' } as any;
  const mockPost = {
    id: 'pid', userId: 'uid', content: 'hello', imageKey: null,
    likeCount: 0, commentCount: 0, isPublic: true,
    createdAt: new Date(), updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PostRepository, useValue: { findById: jest.fn(), findByIdWithAuthor: jest.fn(), getFeed: jest.fn(), getAuthorPosts: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } },
        { provide: CommentRepository, useValue: { findCommentImageKeysByPost: jest.fn() } },
        { provide: LikeRepository, useValue: { getUserLikedPostIds: jest.fn(), getTopLikersForPosts: jest.fn().mockResolvedValue(new Map()) } },
        { provide: StorageService, useValue: { getPublicUrl: jest.fn(() => null), delete: jest.fn().mockResolvedValue(undefined) } },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get(PostRepository);
    commentRepo = module.get(CommentRepository);
    likeRepo = module.get(LikeRepository);
    cache = module.get(CacheService);
  });

  describe('create', () => {
    it('should throw if no content and no imageKey', async () => {
      await expect(service.create(mockUser, {})).rejects.toThrow('Post must have content or an image');
    });

    it('should create post', async () => {
      postRepo.create.mockResolvedValue(mockPost);
      const result = await service.create(mockUser, { content: 'hello', isPublic: true });
      expect(postRepo.create).toHaveBeenCalledWith({ userId: 'uid', content: 'hello', imageKey: null, isPublic: true });
      expect(result.id).toBe('pid');
    });
  });

  describe('findById', () => {
    it('should throw NotFound if post missing', async () => {
      postRepo.findByIdWithAuthor.mockResolvedValue(null);
      await expect(service.findById(mockUser, 'pid')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFound if private and not owner', async () => {
      postRepo.findByIdWithAuthor.mockResolvedValue({ ...mockPost, isPublic: false, userId: 'other' } as any);
      await expect(service.findById(mockUser, 'pid')).rejects.toThrow(NotFoundException);
    });

    it('should return cached post if present', async () => {
      const cached = { id: 'pid' };
      cache.get.mockResolvedValue(cached);
      const result = await service.findById(mockUser, 'pid');
      expect(result).toBe(cached);
      expect(postRepo.findByIdWithAuthor).not.toHaveBeenCalled();
    });
  });

  describe('getFeed', () => {
    it('should return feed with hasLiked', async () => {
      const rows = [{ ...mockPost, authorId: 'auid', authorFirstName: 'A', authorLastName: 'B' }];
      postRepo.getFeed.mockResolvedValue(rows as any);
      likeRepo.getUserLikedPostIds.mockResolvedValue(new Set(['pid']));

      const result = await service.getFeed(mockUser);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].hasLiked).toBe(true);
      expect(result.nextCursor).toBeNull();
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUserPosts', () => {
    it('should include private posts when viewing own profile', async () => {
      const rows = [{ ...mockPost, authorId: 'uid', authorFirstName: 'A', authorLastName: 'B' }];
      postRepo.getAuthorPosts.mockResolvedValue(rows as any);
      likeRepo.getUserLikedPostIds.mockResolvedValue(new Set());

      const result = await service.getUserPosts(mockUser, 'uid');
      expect(postRepo.getAuthorPosts).toHaveBeenCalledWith('uid', null, 20, true);
      expect(result.items[0].hasLiked).toBe(false);
    });

    it('should only show public posts for other users', async () => {
      postRepo.getAuthorPosts.mockResolvedValue([]);
      likeRepo.getUserLikedPostIds.mockResolvedValue(new Set());

      await service.getUserPosts(mockUser, 'other');
      expect(postRepo.getAuthorPosts).toHaveBeenCalledWith('other', null, 20, false);
    });
  });

  describe('update', () => {
    it('should throw if not owner', async () => {
      postRepo.findById.mockResolvedValue({ ...mockPost, userId: 'other' } as any);
      await expect(service.update(mockUser, 'pid', { content: 'x' })).rejects.toThrow(ForbiddenException);
    });

    it('should update own post', async () => {
      postRepo.findById.mockResolvedValue(mockPost);
      postRepo.update.mockResolvedValue({ ...mockPost, content: 'updated' });
      cache.del.mockResolvedValue(undefined);
      const result = await service.update(mockUser, 'pid', { content: 'updated' });
      expect(result.content).toBe('updated');
    });
  });

  describe('remove', () => {
    it('should throw if not owner', async () => {
      postRepo.findById.mockResolvedValue({ ...mockPost, userId: 'other' } as any);
      await expect(service.remove(mockUser, 'pid')).rejects.toThrow(ForbiddenException);
    });

    it('should delete own post', async () => {
      commentRepo.findCommentImageKeysByPost.mockResolvedValue([]);
      postRepo.findById.mockResolvedValue(mockPost);
      postRepo.delete.mockResolvedValue(undefined as any);
      await expect(service.remove(mockUser, 'pid')).resolves.toBeUndefined();
      expect(postRepo.delete).toHaveBeenCalledWith('pid');
    });
  });
});
