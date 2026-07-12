import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsController } from './controller/uploads.controller';
import { UploadsService } from './service/uploads.service';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}