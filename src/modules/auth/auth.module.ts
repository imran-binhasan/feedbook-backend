import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { UserController } from './controller/user.controller';
import { AuthService } from './service/auth.service';
import { SessionService } from './service/session.service';
import { UserService } from './service/users.service';
import { AuthGuard } from './guard/auth.guard';

@Module({
  controllers: [AuthController, UserController],
  providers: [AuthService, SessionService, UserService, AuthGuard],
  exports: [AuthGuard, SessionService],
})
export class AuthModule {}