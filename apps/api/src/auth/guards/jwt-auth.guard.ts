import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | undefined,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException({
            code: 'UNAUTHENTICATED',
            message: '로그인이 필요합니다.',
          });
    }
    return user;
  }
}
