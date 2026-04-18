import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlanSlotItemDto {
  /** 기존 슬롯 유지 시 서버가 내려준 id. 생략 시 신규 생성 */
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsIn(['all_day', 'am', 'pm'])
  period: 'all_day' | 'am' | 'pm';

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
