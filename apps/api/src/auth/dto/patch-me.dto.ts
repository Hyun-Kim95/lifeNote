import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class PatchMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;
}
