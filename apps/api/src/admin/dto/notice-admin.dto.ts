import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminNoticeDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsString()
  publishStartAt?: string;

  @IsOptional()
  @IsString()
  publishEndAt?: string;
}

export class PatchAdminNoticeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsString()
  publishStartAt?: string;

  @IsOptional()
  @IsString()
  publishEndAt?: string;
}
