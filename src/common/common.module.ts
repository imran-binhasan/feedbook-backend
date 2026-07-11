import { Global, Module } from '@nestjs/common';
import { PasswordHasher } from './services/password-hasher.service';

@Global()
@Module({
  providers: [PasswordHasher],
  exports: [PasswordHasher],
})
export class CommonModule {}
