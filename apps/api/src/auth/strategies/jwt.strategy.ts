import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; role: string; typ?: string }) {
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: '액세스 토큰이 필요합니다.',
      });
    }
    return { userId: payload.sub, role: payload.role };
  }
}
