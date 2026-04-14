import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PutWeekPlanDto } from './dto/put-week-plan.dto';
import { PlansService } from './plans.service';

@Controller('plans/weeks')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get(':weekStart')
  getWeek(
    @CurrentUser() user: RequestUser,
    @Param('weekStart') weekStart: string,
  ) {
    return this.plans.getWeek(user.userId, weekStart);
  }

  @Put(':weekStart')
  putWeek(
    @CurrentUser() user: RequestUser,
    @Param('weekStart') weekStart: string,
    @Body() dto: PutWeekPlanDto,
  ) {
    return this.plans.putWeek(user.userId, weekStart, dto);
  }
}
