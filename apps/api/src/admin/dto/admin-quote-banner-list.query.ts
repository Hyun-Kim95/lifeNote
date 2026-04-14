import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminPageQueryDto } from './admin-page.query';

export class AdminQuoteBannerListQueryDto extends AdminPageQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    return value === true || value === 'true' || value === '1';
  })
  @IsBoolean()
  active?: boolean;
}
