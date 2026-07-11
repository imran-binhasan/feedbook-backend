import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database.module';
import { UserRepository } from './user.repository';
import { SessionRepository } from './session.repository';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [UserRepository, SessionRepository],
  exports: [UserRepository, SessionRepository],
})
export class RepositoriesModule {}
