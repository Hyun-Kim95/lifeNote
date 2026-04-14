import { Module } from '@nestjs/common';
import { QuoteBannersController } from './quote-banners.controller';
import { QuoteBannersService } from './quote-banners.service';

@Module({
  controllers: [QuoteBannersController],
  providers: [QuoteBannersService],
})
export class QuoteBannersModule {}
