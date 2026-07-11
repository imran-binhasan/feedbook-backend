import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { uuidv7 } from 'uuidv7';

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicBaseUrl = config.get<string>('R2_PUBLIC_BASE_URL') ?? undefined;

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: config.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: false,
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { key, url: this.getPublicUrl(key)! };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete R2 object "${key}"`, error);
    }
  }

  getPublicUrl(key: string | null | undefined): string | null {
    if (!key) return null;
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
    }
    return null;
  }

  buildKey(prefix: string, userId: string, mimeType: string): string {
    const ext = MIME_EXT_MAP[mimeType] ?? 'bin';
    return `${prefix}/${userId}/${uuidv7()}.${ext}`;
  }
}
