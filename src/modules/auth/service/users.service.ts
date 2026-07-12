import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../../infrastructure/database/repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import type { UserProfile } from '../../../common/types/request.type';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserProfile> {
    const user = await this.userRepository.update(id, dto);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
