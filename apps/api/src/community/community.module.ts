import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommunityPostsController } from './community-posts.controller';
import { CommunityPostsService } from './community-posts.service';
import { CommunityReportsController } from './community-reports.controller';
import { CommunityReportsService } from './community-reports.service';

@Module({
  imports: [AuthModule],
  controllers: [CommunityPostsController, CommunityReportsController],
  providers: [CommunityPostsService, CommunityReportsService],
})
export class CommunityModule {}
