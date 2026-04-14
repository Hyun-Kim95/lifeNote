import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminDiaryTemplateDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsObject()
  schema: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class PatchAdminDiaryTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsObject()
  schema?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
