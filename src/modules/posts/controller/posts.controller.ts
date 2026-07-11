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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../access/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { PostsService } from '../service/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import type { CurrentUserPayload } from '../../../common/types/request.type';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'posts' })
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Unsupported image type. Allowed: jpg, png, webp',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an image and get back a key + URL' })
  async uploadImage(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.postsService.uploadImage(user, file);
  }

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

  @Get('users/:userId/posts')
  @ApiOperation({ summary: 'Get paginated posts for a user' })
  async getUserPosts(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getUserPosts(user, userId, cursor, limit);
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
