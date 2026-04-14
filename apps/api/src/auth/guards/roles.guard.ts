import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const role = req.user?.role;

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '관리자 권한이 필요합니다.',
      });
    }
    return true;
  }
}
