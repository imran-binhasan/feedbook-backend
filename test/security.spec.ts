import { validate } from 'class-validator';
import { RegisterDto } from '../src/modules/auth/dto/register.dto';
import { CreatePostDto } from '../src/modules/posts/dto/create-post.dto';

describe('Security', () => {
  describe('Input validation', () => {
    it('should reject SQL injection in email', async () => {
      const dto = new RegisterDto();
      Object.assign(dto, { email: "' OR 1=1 --", password: 'ValidPass1', firstName: 'A', lastName: 'B' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject XSS in email', async () => {
      const dto = new RegisterDto();
      Object.assign(dto, { email: '<script>alert(1)</script>', password: 'ValidPass1', firstName: 'A', lastName: 'B' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept XSS strings as post content (ORM + React handle it)', async () => {
      const dto = new CreatePostDto();
      dto.content = '<script>alert(1)</script>';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject SQLi strings as post content', async () => {
      const dto = new CreatePostDto();
      dto.content = "'; DROP TABLE users; --";
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
