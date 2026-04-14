import { IsIn, IsOptional, Matches } from 'class-validator';

export class StatsSummaryQueryDto {
  @IsOptional()
  @IsIn(['week', 'month', 'year'])
  range?: 'week' | 'month' | 'year';

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  anchor?: string;
}
