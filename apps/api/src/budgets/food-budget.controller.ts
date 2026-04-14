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
import { PutFoodMonthDto } from './dto/put-food-month.dto';
import { PutFoodDayDto } from './dto/put-food-day.dto';
import { FoodBudgetService } from './food-budget.service';

@Controller('budgets/food/months')
@UseGuards(JwtAuthGuard)
export class FoodBudgetController {
  constructor(private readonly food: FoodBudgetService) {}

  @Get(':yearMonth/days')
  getDays(
    @CurrentUser() user: RequestUser,
    @Param('yearMonth') yearMonth: string,
  ) {
    return this.food.getDays(user.userId, yearMonth);
  }

  @Put(':yearMonth/days/:date')
  putDay(
    @CurrentUser() user: RequestUser,
    @Param('yearMonth') yearMonth: string,
    @Param('date') date: string,
    @Body() dto: PutFoodDayDto,
  ) {
    return this.food.putDay(user.userId, yearMonth, date, dto);
  }

  @Get(':yearMonth')
  getMonth(
    @CurrentUser() user: RequestUser,
    @Param('yearMonth') yearMonth: string,
  ) {
    return this.food.getMonth(user.userId, yearMonth);
  }

  @Put(':yearMonth')
  putMonth(
    @CurrentUser() user: RequestUser,
    @Param('yearMonth') yearMonth: string,
    @Body() dto: PutFoodMonthDto,
  ) {
    return this.food.putMonth(user.userId, yearMonth, dto.budgetAmount);
  }
}
