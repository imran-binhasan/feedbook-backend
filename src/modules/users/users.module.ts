import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { UsersController } from './controller/users.controller';
import { UserService } from './service/users.service';

@Module({
  imports: [AccessModule],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
