import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { UserRepository } from './user.repository';
import { SessionRepository } from './session.repository';
import { PostRepository } from './post.repository';
import { CommentRepository } from './comment.repository';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [UserRepository, SessionRepository, PostRepository, CommentRepository],
  exports: [UserRepository, SessionRepository, PostRepository, CommentRepository],
})
export class RepositoriesModule {}
