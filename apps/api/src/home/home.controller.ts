import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HomeService } from './home.service';

@Controller('home')
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: RequestUser,
    @Query('date') date?: string,
  ) {
    return this.home.summary(user.userId, date);
  }
}
