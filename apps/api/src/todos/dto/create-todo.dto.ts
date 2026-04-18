import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export const TODO_SCHEDULE_TYPES = [
  'once',
  'daily',
  'weekly',
  'monthly',
  'interval',
  'someday',
] as const;

export type TodoScheduleType = (typeof TODO_SCHEDULE_TYPES)[number];

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueOn?: string;

  /** ISO 8601 시각(UTC 권장). once 등에서 날짜+시간 정렬에 사용 */
  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high';

  @IsOptional()
  @IsIn(TODO_SCHEDULE_TYPES)
  scheduleType?: TodoScheduleType;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string | null;

  @ValidateIf((o) => o.scheduleType === 'weekly')
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekdays?: number[];

  @ValidateIf((o) => o.scheduleType === 'monthly')
  @IsInt()
  @Min(1)
  @Max(31)
  monthDay?: number;

  @ValidateIf((o) => o.scheduleType === 'interval')
  @IsInt()
  @Min(1)
  intervalDays?: number;

  /** 주간 계획 슬롯에서 생성 시(해당 슬롯 id, 본인 소유만 허용) */
  @IsOptional()
  @IsString()
  planSlotId?: string;

  /** 종일·오전·오후(미지정 시 null) */
  @IsOptional()
  @IsIn(['all_day', 'am', 'pm'])
  dayPeriod?: 'all_day' | 'am' | 'pm';
}
