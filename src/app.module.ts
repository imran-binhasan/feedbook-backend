import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envValidationSchema } from '../env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RepositoriesModule } from './infrastructure/database/repositories/repositories.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { REDIS_CLIENT } from './infrastructure/cache/cache.constants';
import { RedisThrottlerStorage } from './infrastructure/cache/redis-throttler.storage';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { RepliesModule } from './modules/replies/replies.module';
import { AllExceptionsFilter } from './common/filter/all-exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import type Redis from 'ioredis';

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
    CacheModule,
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT, ConfigService],
      useFactory: (redis: Redis | null, config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
          },
        ],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    CommonModule,
    AuthModule,
    UploadsModule,
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