import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { UserRepository } from './user.repository';
import { SessionRepository } from './session.repository';
import { PostRepository } from './post.repository';
import { CommentRepository } from './comment.repository';
import { LikeRepository } from './like.repository';
import { ReplyRepository } from './reply.repository';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    UserRepository,
    SessionRepository,
    PostRepository,
    CommentRepository,
    LikeRepository,
    ReplyRepository,
  ],
  exports: [
    UserRepository,
    SessionRepository,
    PostRepository,
    CommentRepository,
    LikeRepository,
    ReplyRepository,
  ],
})
export class RepositoriesModule {}
