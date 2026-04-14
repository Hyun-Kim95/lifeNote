import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CommunityReportsService } from './community-reports.service';
import { CreateCommunityReportDto } from './dto/create-community-report.dto';

@Controller('community/reports')
@UseGuards(JwtAuthGuard)
export class CommunityReportsController {
  constructor(private readonly reports: CommunityReportsService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCommunityReportDto,
  ) {
    return this.reports.createReport(user.userId, dto);
  }
}
