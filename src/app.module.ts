import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { RepliesModule } from './modules/replies/replies.module';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filter/all-exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    RepliesModule,
  ],
  controllers: [],
  providers: [
    { provide: 'APP_FILTER', useClass: AllExceptionsFilter },
    { provide: 'APP_INTERCEPTOR', useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
