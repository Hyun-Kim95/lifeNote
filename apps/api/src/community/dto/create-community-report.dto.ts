import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityReportDto {
  @IsIn(['post', 'comment'])
  targetType: 'post' | 'comment';

  @IsString()
  @MaxLength(200)
  targetId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
