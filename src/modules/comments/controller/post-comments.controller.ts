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
import { CommentsService } from '../service/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'posts' })
export class PostCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':postId/comments')
  @ApiOperation({ summary: 'Create a comment on a post' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user, postId, dto);
  }

  @Get(':postId/comments')
  @ApiOperation({ summary: 'Get paginated comments for a post' })
  async getByPost(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.getByPost(user, postId, cursor, limit);
  }
}