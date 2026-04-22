import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { FOOD_DAY_CATEGORY_VALUES } from '../food-day-category';

class PutFoodCategoryBudgetDto {
  @IsIn(FOOD_DAY_CATEGORY_VALUES)
  category: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetAmount?: number | null;
}

export class PutFoodMonthDto {
  @IsInt()
  @Min(0)
  budgetAmount: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PutFoodCategoryBudgetDto)
  categoryBudgets?: PutFoodCategoryBudgetDto[];
}
