import { Module } from '@nestjs/common';
import { AdminDiaryTemplatesController } from './admin-diary-templates.controller';
import { AdminNoticesController } from './admin-notices.controller';
import { AdminQuoteBannersController } from './admin-quote-banners.controller';
import { AdminUsersController } from './admin-users.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  controllers: [
    AdminNoticesController,
    AdminQuoteBannersController,
    AdminDiaryTemplatesController,
    AdminUsersController,
  ],
  providers: [RolesGuard],
})
export class AdminModule {}
