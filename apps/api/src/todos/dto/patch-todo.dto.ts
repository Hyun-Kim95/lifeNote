import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class PatchTodoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueOn?: string | null;

  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high';

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
