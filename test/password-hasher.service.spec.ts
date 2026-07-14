import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasher } from '../src/common/services/password-hasher.service';

describe('PasswordHasher', () => {
  let service: PasswordHasher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordHasher],
    }).compile();

    service = module.get<PasswordHasher>(PasswordHasher);
  });

  it('should hash and verify a password', async () => {
    const password = 'TestPass123';
    const hash = await service.hash(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    const valid = await service.compare(password, hash);
    expect(valid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await service.hash('CorrectPass1');
    const valid = await service.compare('WrongPass1', hash);
    expect(valid).toBe(false);
  });

  it('should produce different hashes for same password', async () => {
    const password = 'TestPass123';
    const [hash1, hash2] = await Promise.all([
      service.hash(password),
      service.hash(password),
    ]);
    expect(hash1).not.toBe(hash2);
  });
});
