import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';

@Module({
  imports: [AccessModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
