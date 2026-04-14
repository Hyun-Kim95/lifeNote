import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class ListNoticesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return true;
    }
    if (value === 'false' || value === '0' || value === false) {
      return false;
    }
    return value === true || value === 'true' || value === '1';
  })
  @IsBoolean()
  pinnedFirst?: boolean;
}
