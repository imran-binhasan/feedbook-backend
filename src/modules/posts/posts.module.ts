import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsController } from './controller/posts.controller';
import { UserPostsController } from './controller/user-posts.controller';
import { PostsService } from './service/posts.service';

@Module({
  imports: [AuthModule],
  controllers: [PostsController, UserPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}