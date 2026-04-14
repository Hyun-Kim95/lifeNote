import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('oauth/exchange')
  exchange(@Body() dto: OAuthExchangeDto) {
    return this.auth.exchangeOAuth(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto);
  }
}
