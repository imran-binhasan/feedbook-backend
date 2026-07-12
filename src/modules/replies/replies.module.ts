import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostCommentRepliesController } from './controller/post-comment-replies.controller';
import { RepliesController } from './controller/replies.controller';
import { RepliesService } from './service/replies.service';

@Module({
  imports: [AuthModule],
  controllers: [PostCommentRepliesController, RepliesController],
  providers: [RepliesService],
})
export class RepliesModule {}
