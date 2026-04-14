import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async exchangeOAuth(dto: OAuthExchangeDto) {
    if (dto.provider !== 'google') {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: '지원하지 않는 provider 입니다.',
      });
    }
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');

    const oauth2 = new OAuth2Client(clientId, clientSecret, dto.redirectUri);

    let sub: string;
    let email: string | undefined;
    let name: string | undefined;

    try {
      const { tokens } = await oauth2.getToken(dto.authorizationCode);
      oauth2.setCredentials(tokens);

      if (tokens.id_token) {
        const ticket = await oauth2.verifyIdToken({
          idToken: tokens.id_token,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload?.sub) {
          throw new UnauthorizedException({
            code: 'UNAUTHENTICATED',
            message: 'Google 토큰 페이로드가 올바르지 않습니다.',
          });
        }
        sub = payload.sub;
        email = payload.email ?? undefined;
        name = payload.name ?? undefined;
      } else if (tokens.access_token) {
        const res = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          },
        );
        if (!res.ok) {
          throw new UnauthorizedException({
            code: 'UNAUTHENTICATED',
            message: 'Google 사용자 정보를 가져오지 못했습니다.',
          });
        }
        const body = (await res.json()) as {
          sub?: string;
          email?: string;
          name?: string;
        };
        if (!body.sub) {
          throw new UnauthorizedException({
            code: 'UNAUTHENTICATED',
            message: 'Google 사용자 정보가 올바르지 않습니다.',
          });
        }
        sub = body.sub;
        email = body.email;
        name = body.name;
      } else {
        throw new UnauthorizedException({
          code: 'UNAUTHENTICATED',
          message: 'Google 응답에 토큰이 없습니다.',
        });
      }
    } catch (e) {
      if (e instanceof UnauthorizedException || e instanceof ConflictException) {
        throw e;
      }
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Google 인증에 실패했습니다.',
      });
    }

    const user = await this.upsertGoogleUser(sub, email, name);
    return this.buildTokenResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    let payload: { sub: string; typ?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; typ?: string }>(
        dto.refreshToken,
        { secret },
      );
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: '리프레시 토큰이 유효하지 않습니다.',
      });
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: '리프레시 토큰이 유효하지 않습니다.',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    return this.buildTokenResponse(user);
  }

  private async upsertGoogleUser(
    sub: string,
    email: string | undefined,
    name: string | undefined,
  ): Promise<User> {
    const existingAcc = await this.prisma.account.findUnique({
      where: {
        provider_providerId: { provider: 'google', providerId: sub },
      },
      include: { user: true },
    });

    if (existingAcc) {
      if (name && !existingAcc.user.displayName) {
        return this.prisma.user.update({
          where: { id: existingAcc.userId },
          data: { displayName: name },
        });
      }
      return existingAcc.user;
    }

    if (email) {
      const userByEmail = await this.prisma.user.findUnique({
        where: { email },
        include: { accounts: true },
      });
      if (userByEmail) {
        const nonGoogle = userByEmail.accounts.find((a) => a.provider !== 'google');
        if (nonGoogle) {
          throw new ConflictException({
            code: 'CONFLICT',
            message: '이 이메일은 다른 로그인 방식에 연결되어 있습니다.',
          });
        }
        const googleAcc = userByEmail.accounts.find((a) => a.provider === 'google');
        if (googleAcc && googleAcc.providerId !== sub) {
          throw new ConflictException({
            code: 'CONFLICT',
            message: 'Google 계정 정보가 일치하지 않습니다.',
          });
        }
        if (!googleAcc) {
          await this.prisma.account.create({
            data: {
              userId: userByEmail.id,
              provider: 'google',
              providerId: sub,
            },
          });
        }
        if (name && !userByEmail.displayName) {
          return this.prisma.user.update({
            where: { id: userByEmail.id },
            data: { displayName: name },
          });
        }
        return userByEmail;
      }
    }

    return this.prisma.user.create({
      data: {
        ...(email ? { email } : {}),
        displayName: name ?? null,
        accounts: {
          create: { provider: 'google', providerId: sub },
        },
      },
    });
  }

  private async buildTokenResponse(user: User) {
    const roleApi: 'user' | 'admin' =
      user.role === UserRole.ADMIN ? 'admin' : 'user';
    const expiresIn =
      Number(this.config.get<string>('JWT_ACCESS_EXPIRES_SEC')) || 3600;

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: roleApi },
      { expiresIn },
    );

    const refreshExpiresSec =
      Number(this.config.get<string>('JWT_REFRESH_EXPIRES_SEC')) ||
      30 * 24 * 3600;
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, typ: 'refresh' },
      { expiresIn: refreshExpiresSec },
    );

    const me = await this.users.getMe(user.id);

    return {
      accessToken,
      expiresIn,
      refreshToken,
      tokenType: 'Bearer' as const,
      user: {
        id: me.id,
        displayName: me.displayName,
        role: me.role,
      },
    };
  }
}
