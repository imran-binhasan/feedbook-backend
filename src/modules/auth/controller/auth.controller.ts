import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { SessionService } from '../service/session.service';
import { AuthGuard } from '../guard/auth.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import type { AuthenticatedRequest } from '../../../common/types/request.type';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller({ version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('auth/register')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Sign up for a new account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('auth/login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and receive a session token' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(@Req() req: AuthenticatedRequest) {
    const authHeader = req.headers['authorization'] as string;
    const token = authHeader.split(' ')[1];
    await this.sessionService.revoke(token);
  }

}