import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { RepliesService } from '../service/replies.service';
import { CreateReplyDto } from '../dto/create-reply.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Replies')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'posts' })
export class PostCommentRepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  @Post(':postId/comments/:commentId/replies')
  @ApiOperation({ summary: 'Create a reply on a comment' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.repliesService.create(user, commentId, dto);
  }

  @Get(':postId/comments/:commentId/replies')
  @ApiOperation({ summary: 'Get paginated replies for a comment' })
  async getByComment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.repliesService.getByComment(user, commentId, cursor, limit);
  }
}
