import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../access/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { CommentsService } from '../service/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'comments' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment on a post' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated comments for a post' })
  async getByPost(
    @CurrentUser() user: CurrentUserPayload,
    @Query('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (!postId)
      throw new BadRequestException('postId query parameter is required');
    return this.commentsService.getByPost(user, postId, cursor, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.commentsService.remove(user, id);
  }
}
