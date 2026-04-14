import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FoodBudgetController } from './food-budget.controller';
import { FoodBudgetService } from './food-budget.service';

@Module({
  imports: [AuthModule],
  controllers: [FoodBudgetController],
  providers: [FoodBudgetService],
  exports: [FoodBudgetService],
})
export class BudgetsModule {}
