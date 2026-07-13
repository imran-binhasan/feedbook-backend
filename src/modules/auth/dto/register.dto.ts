import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Doe', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'Secret1pass', minLength: 8, maxLength: 64 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/[a-z]/, { message: 'Password must include at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must include at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must include at least one number' })
  password!: string;
}
