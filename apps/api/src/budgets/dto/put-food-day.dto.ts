import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { FOOD_DAY_CATEGORY_VALUES } from '../food-day-category';

export class PutFoodDayDto {
  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;

  @IsOptional()
  @IsString()
  @IsIn([...FOOD_DAY_CATEGORY_VALUES])
  category?: string;
}
