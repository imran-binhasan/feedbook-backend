import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RepositoriesModule } from '../../infrastructure/database/repositories/repositories.module';
import { PostCommentRepliesController } from './controller/post-comment-replies.controller';
import { RepliesController } from './controller/replies.controller';
import { RepliesService } from './service/replies.service';

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [PostCommentRepliesController, RepliesController],
  providers: [RepliesService],
  exports: [RepliesService],
})
export class RepliesModule {}
