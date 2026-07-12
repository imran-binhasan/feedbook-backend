import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import { UploadsService } from '../service/uploads.service';
import type { CurrentUserPayload } from '../../../common/types/request.type';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'uploads' })
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
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
  @ApiOperation({ summary: 'Upload an image and receive key + URL' })
  async uploadImage(
    @CurrentUser() user: CurrentUserPayload,
    @Body('folder') folder: 'posts' | 'comments' | 'replies',
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(user, file, folder);
  }
}