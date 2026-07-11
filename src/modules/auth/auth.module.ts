import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { SessionService } from './service/session.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService],
})
export class AuthModule {}
