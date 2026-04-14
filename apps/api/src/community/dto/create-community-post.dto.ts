import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  @MaxLength(20000)
  body: string;
}
