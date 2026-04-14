import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueOn?: string;

  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: 'low' | 'normal' | 'high';
}
