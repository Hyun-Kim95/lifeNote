import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PutFoodDayDto {
  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}
