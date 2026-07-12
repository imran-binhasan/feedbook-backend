import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { SessionService } from '../service/session.service';
import { AuthGuard } from '../guard/auth.guard';
import { UserService } from '../service/users.service';
import { RegisterDto } from '../dto/register.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { LoginDto } from '../dto/login.dto';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import type {
  AuthenticatedRequest,
  CurrentUserPayload,
} from '../../../common/types/request.type';

@ApiTags('Auth')
@Controller({ version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
  ) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Sign up for a new account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('auth/login')
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

  @Get('users/me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.findById(user.userId);
  }

  @Patch('users/me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the current user profile' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(user.userId, dto);
  }
}