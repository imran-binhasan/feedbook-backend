import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from '../env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RepositoriesModule } from './infrastructure/database/repositories/repositories.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { CommonModule } from './common/common.module';
import { AccessModule } from './modules/access/access.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { RepliesModule } from './modules/replies/replies.module';
import { AllExceptionsFilter } from './common/filter/all-exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    RepositoriesModule,
    StorageModule,
    CommonModule,
    AccessModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('{*path}');
  }
}
