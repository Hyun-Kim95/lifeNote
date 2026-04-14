import { IsInt, Min } from 'class-validator';

export class PutFoodMonthDto {
  @IsInt()
  @Min(0)
  budgetAmount: number;
}
