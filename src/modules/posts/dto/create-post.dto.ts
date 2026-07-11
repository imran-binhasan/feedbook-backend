import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiPropertyOptional({ example: 'Hello world!', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ example: 'posts/abc123/def456.jpg', maxLength: 1024 })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  imageKey?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
