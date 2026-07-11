import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../../infrastructure/database/database-connection';
import type { DrizzleDB } from '../../../infrastructure/database/database-connection';
import { users } from '../../../infrastructure/database/schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { hashPass } from '../../../common/utils/hashpass';

@Injectable()
export class UserService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await hashPass(dto.password);

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      });

    return user;
  }
}