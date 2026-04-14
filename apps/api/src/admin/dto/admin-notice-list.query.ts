import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminPageQueryDto } from './admin-page.query';

export class AdminNoticeListQueryDto extends AdminPageQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['draft', 'scheduled', 'published', 'ended'])
  status?: 'draft' | 'scheduled' | 'published' | 'ended';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    return value === true || value === 'true' || value === '1';
  })
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
