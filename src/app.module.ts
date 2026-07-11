import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AModule } from './a/a.module';
import { RepliesModule } from './modules/replies/replies.module';
import { LikesModule } from './modules/likes/likes.module';
import { CommentsModule } from './modules/comments/comments.module';
import { PostsModule } from './modules/posts/posts.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AModule } from './a/a.module';

@Module({
  imports: [AModule, AuthModule, UsersModule, PostsModule, CommentsModule, LikesModule, RepliesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
