import { Controller, Get } from '@nestjs/common';
import { QuoteBannersService } from './quote-banners.service';

@Controller('quote-banners')
export class QuoteBannersController {
  constructor(private readonly quotes: QuoteBannersService) {}

  @Get('active')
  active() {
    return this.quotes.listActive();
  }
}
