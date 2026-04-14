import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminPageQueryDto } from './admin-page.query';

export class AdminUsersListQueryDto extends AdminPageQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';
}

export class PatchAdminUserDto {
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}
