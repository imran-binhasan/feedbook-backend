import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { CommentsController } from './controller/comments.controller';
import { CommentsService } from './service/comments.service';

@Module({
  imports: [AccessModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
