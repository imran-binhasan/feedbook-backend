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
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { PostsService } from '../service/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'posts' })
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(user, dto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get paginated public feed' })
  async getFeed(
    @CurrentUser() user: CurrentUserPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getFeed(user, cursor, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  async findById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.postsService.findById(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.postsService.remove(user, id);
  }
}