import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { PatchMeDto } from './dto/patch-me.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: RequestUser) {
    return this.users.getMe(user.userId);
  }

  @Patch()
  patchMe(@CurrentUser() user: RequestUser, @Body() dto: PatchMeDto) {
    return this.users.patchMe(user.userId, dto);
  }
}
