import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { PutDiaryDto } from './dto/put-diary.dto';
import { DiariesService } from './diaries.service';

@Controller()
export class DiariesController {
  constructor(private readonly diaries: DiariesService) {}

  @Get('diary-templates')
  listTemplates() {
    return this.diaries.listTemplates();
  }

  @Get('diaries/:date')
  @UseGuards(JwtAuthGuard)
  getByDate(@CurrentUser() user: RequestUser, @Param('date') date: string) {
    return this.diaries.getByDate(user.userId, date);
  }

  @Put('diaries/:date')
  @UseGuards(JwtAuthGuard)
  putByDate(
    @CurrentUser() user: RequestUser,
    @Param('date') date: string,
    @Body() dto: PutDiaryDto,
  ) {
    return this.diaries.putByDate(user.userId, date, dto);
  }
}
