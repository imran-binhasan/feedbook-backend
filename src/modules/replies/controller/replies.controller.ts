import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { RepliesService } from '../service/replies.service';
import { UpdateReplyDto } from '../dto/update-reply.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Replies')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'replies' })
export class RepliesController {
  constructor(private readonly repliesService: RepliesService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reply' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReplyDto,
  ) {
    return this.repliesService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reply' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.repliesService.remove(user, id);
  }
}
