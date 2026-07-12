import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateReplyDto {
  @ApiProperty({ example: 'Great point!', description: 'Reply content' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}
