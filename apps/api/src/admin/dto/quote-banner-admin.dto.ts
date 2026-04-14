import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminQuoteBannerDto {
  @IsString()
  @MaxLength(500)
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;
}

export class PatchAdminQuoteBannerDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;
}
