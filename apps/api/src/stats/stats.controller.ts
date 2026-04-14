import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { StatsSummaryQueryDto } from './dto/stats-summary.query';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('summary')
  summary(@CurrentUser() user: RequestUser, @Query() query: StatsSummaryQueryDto) {
    return this.stats.getSummary(user.userId, query);
  }
}
