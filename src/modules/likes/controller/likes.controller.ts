import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { LikesService } from '../service/likes.service';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Likes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1' })
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('posts/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a post' })
  async togglePost(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.likesService.togglePost(user, id);
  }

  @Get('posts/:id/likes')
  @ApiOperation({ summary: 'Get users who liked a post' })
  async getPostLikers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.likesService.getPostLikers(user, id, cursor, limit);
  }

  @Post('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a comment' })
  async toggleComment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.likesService.toggleComment(user, id);
  }

  @Get('comments/:id/likes')
  @ApiOperation({ summary: 'Get users who liked a comment' })
  async getCommentLikers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.likesService.getCommentLikers(user, id, cursor, limit);
  }

  @Post('replies/:id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a reply' })
  async toggleReply(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.likesService.toggleReply(user, id);
  }

  @Get('replies/:id/likes')
  @ApiOperation({ summary: 'Get users who liked a reply' })
  async getReplyLikers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.likesService.getReplyLikers(user, id, cursor, limit);
  }
}
