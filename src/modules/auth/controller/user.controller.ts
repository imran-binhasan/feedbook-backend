import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guard/auth.guard';
import { UserService } from '../service/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CurrentUser } from '../../../common/decorator/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/types/request.type';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({ version: '1', path: 'users' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.findById(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(user.userId, dto);
  }
}
