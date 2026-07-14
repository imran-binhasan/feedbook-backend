import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/service/auth.service';
import { PasswordHasher } from '../src/common/services/password-hasher.service';
import { UserRepository } from '../src/infrastructure/database/repositories/user.repository';
import { SessionService } from '../src/modules/auth/service/session.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<UserRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let sessionService: jest.Mocked<SessionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: { findByEmail: jest.fn(), create: jest.fn() },
        },
        {
          provide: PasswordHasher,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
        {
          provide: SessionService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(UserRepository);
    hasher = module.get(PasswordHasher);
    sessionService = module.get(SessionService);
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: '1' } as any);
      await expect(
        service.register({ email: 'a@b.com', password: 'Pass1234', firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and session on success', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      hasher.hash.mockResolvedValue('hashed');
      userRepo.create.mockResolvedValue({ id: 'uid', email: 'a@b.com', firstName: 'A', lastName: 'B' } as any);
      sessionService.create.mockResolvedValue({ token: 'tok', expiresAt: new Date() } as any);

      const result = await service.register({ email: 'a@b.com', password: 'Pass1234', firstName: 'A', lastName: 'B' });

      expect(hasher.hash).toHaveBeenCalledWith('Pass1234');
      expect(userRepo.create).toHaveBeenCalledWith({ email: 'a@b.com', firstName: 'A', lastName: 'B', passwordHash: 'hashed' });
      expect(sessionService.create).toHaveBeenCalledWith('uid');
      expect(result.user.email).toBe('a@b.com');
      expect(result.session.token).toBe('tok');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'a@b.com', password: 'Pass1234' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password wrong', async () => {
      userRepo.findByEmail.mockResolvedValue({ passwordHash: 'hash' } as any);
      hasher.compare.mockResolvedValue(false);
      await expect(service.login({ email: 'a@b.com', password: 'WrongPass1' })).rejects.toThrow(UnauthorizedException);
    });

    it('should return user and session on valid login', async () => {
      userRepo.findByEmail.mockResolvedValue({ id: 'uid', email: 'a@b.com', firstName: 'A', lastName: 'B', passwordHash: 'hash' } as any);
      hasher.compare.mockResolvedValue(true);
      sessionService.create.mockResolvedValue({ token: 'tok', expiresAt: new Date() } as any);

      const result = await service.login({ email: 'a@b.com', password: 'Pass1234' });

      expect(hasher.compare).toHaveBeenCalledWith('Pass1234', 'hash');
      expect(result.user.email).toBe('a@b.com');
      expect(result.session.token).toBe('tok');
    });
  });
});
