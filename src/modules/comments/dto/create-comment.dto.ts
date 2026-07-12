import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({ example: 'Great post!', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({ example: 'posts/abc123/def456.jpg', maxLength: 1024 })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  imageKey?: string;
}