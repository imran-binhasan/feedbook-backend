import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@Injectable()
export class UploadsService {
  constructor(private readonly storageService: StorageService) {}

  async uploadImage(
    user: CurrentUserPayload,
    file: Express.Multer.File,
    folder: 'posts' | 'comments' | 'replies',
  ): Promise<{ key: string; url: string }> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const key = this.storageService.buildKey(folder, user.userId, file.mimetype);
    return this.storageService.upload(key, file.buffer, file.mimetype);
  }
}