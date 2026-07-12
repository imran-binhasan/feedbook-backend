import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LikesController } from './controller/likes.controller';
import { LikesService } from './service/likes.service';

@Module({
  imports: [AuthModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
