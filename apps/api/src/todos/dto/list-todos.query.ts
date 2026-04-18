import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class ListTodosQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  /** 해당 주 월요일 `YYYY-MM-DD`(UTC). `date`·`yearMonth`와 동시 사용 불가 */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  weekStart?: string;

  /** `YYYY-MM`. `date`·`weekStart`와 동시 사용 불가 */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  yearMonth?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueOn?: string;

  @IsOptional()
  @IsIn(['all', 'open', 'done'])
  status?: 'all' | 'open' | 'done';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
