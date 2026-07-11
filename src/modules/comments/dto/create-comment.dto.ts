import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  postId!: string;

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
