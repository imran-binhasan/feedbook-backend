import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { PostsService } from '../service/posts.service';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'users' })
export class UserPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':userId/posts')
  @ApiOperation({ summary: 'Get paginated posts authored by a user' })
  async getUserPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getUserPosts(user, userId, cursor, limit);
  }
}