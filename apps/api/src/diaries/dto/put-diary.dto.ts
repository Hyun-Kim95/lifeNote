import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PutDiaryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  @MaxLength(20000)
  body: string;
}
