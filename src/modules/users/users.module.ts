import { Module } from '@nestjs/common';
import { UserService } from './service/users.service';

@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
