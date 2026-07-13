import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RepositoriesModule } from '../../infrastructure/database/repositories/repositories.module';
import { CommentsController } from './controller/comments.controller';
import { PostCommentsController } from './controller/post-comments.controller';
import { CommentsService } from './service/comments.service';

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [CommentsController, PostCommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}