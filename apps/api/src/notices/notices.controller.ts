import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListNoticesQueryDto } from './dto/list-notices.query';
import { NoticesService } from './notices.service';

@Controller('notices')
export class NoticesController {
  constructor(private readonly notices: NoticesService) {}

  @Get()
  list(@Query() query: ListNoticesQueryDto) {
    return this.notices.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.notices.getById(id);
  }
}
