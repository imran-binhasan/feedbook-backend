import { Module } from '@nestjs/common';
import { SessionService } from './service/session.service';
import { AuthGuard } from './guard/auth.guard';

@Module({
  providers: [SessionService, AuthGuard],
  exports: [SessionService, AuthGuard],
})
export class AccessModule {}
