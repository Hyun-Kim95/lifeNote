import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiariesController } from './diaries.controller';
import { DiariesService } from './diaries.service';

@Module({
  imports: [AuthModule],
  controllers: [DiariesController],
  providers: [DiariesService],
})
export class DiariesModule {}
