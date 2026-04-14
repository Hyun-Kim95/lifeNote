import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlanSlotItemDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsIn(['morning', 'forenoon', 'afternoon', 'evening'])
  period: 'morning' | 'forenoon' | 'afternoon' | 'evening';

  @IsString()
  @MaxLength(200)
  label: string;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class PutWeekPlanDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PlanSlotItemDto)
  slots: PlanSlotItemDto[];
}
