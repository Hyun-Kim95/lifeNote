import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/** Google OAuth 승인 후 브라우저가 열리는 http(s) 주소. 앱 스킴으로 다시 넘겨 세션 완료. */
const MOBILE_APP_AUTH_DEEP_LINK = 'lifenote://auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Google이 `redirect_uri`로 리디렉션하는 엔드포인트(http/https만 콘솔 등록 가능).
   * 여기서 `code`를 받아 앱 딥링크로 넘긴다.
   */
  @Get(['google/mobile-callback', 'googlemobile-callback'])
  googleMobileOAuthCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ): void {
    if (error) {
      const q = new URLSearchParams();
      q.set('error', error);
      if (errorDescription) q.set('error_description', errorDescription);
      res.redirect(302, `${MOBILE_APP_AUTH_DEEP_LINK}?${q.toString()}`);
      return;
    }
    const q = new URLSearchParams();
    if (code) q.set('code', code);
    if (state) q.set('state', state);
    const tail = q.toString();
    res.redirect(302, tail ? `${MOBILE_APP_AUTH_DEEP_LINK}?${tail}` : MOBILE_APP_AUTH_DEEP_LINK);
  }

  @Post('oauth/exchange')
  exchange(@Body() dto: OAuthExchangeDto) {
    return this.auth.exchangeOAuth(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto);
  }
}
