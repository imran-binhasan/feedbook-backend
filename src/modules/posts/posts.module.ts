import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { PostsController } from './controller/posts.controller';
import { PostsService } from './service/posts.service';

@Module({
  imports: [AccessModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
