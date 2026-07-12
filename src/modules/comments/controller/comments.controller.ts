import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { CommentsService } from '../service/comments.service';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'comments' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

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