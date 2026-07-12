import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateReplyDto {
  @ApiPropertyOptional({ example: 'Updated content' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content?: string;
}
