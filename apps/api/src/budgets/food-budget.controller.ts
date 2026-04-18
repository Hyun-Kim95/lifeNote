import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
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
    @Query('category') category?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursor?: string,
  ) {
    let limit: number | undefined;
    if (limitStr !== undefined && limitStr !== '') {
      const n = parseInt(limitStr, 10);
      if (Number.isFinite(n)) limit = n;
    }
    return this.food.getDays(user.userId, yearMonth, {
      category,
      limit,
      cursor,
    });
  }

  @Post(':yearMonth/days/:date')
  createDay(
    @CurrentUser() user: RequestUser,
    @Param('yearMonth') yearMonth: string,
    @Param('date') date: string,
    @Body() dto: PutFoodDayDto,
  ) {
    return this.food.createDay(user.userId, yearMonth, date, dto);
  }

  @Put(':yearMonth/days/items/:dayId')
  updateDayById(
    @CurrentUser() user: RequestUser,
    @Param('dayId') dayId: string,
    @Body() dto: PutFoodDayDto,
  ) {
    return this.food.updateDayById(user.userId, dayId, dto);
  }

  @Delete(':yearMonth/days/items/:dayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDayById(
    @CurrentUser() user: RequestUser,
    @Param('dayId') dayId: string,
  ) {
    return this.food.deleteDayById(user.userId, dayId);
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
