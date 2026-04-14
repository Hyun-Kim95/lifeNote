import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PatchMeDto } from '../auth/dto/patch-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });
    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    const profile =
      user.profile === null || user.profile === undefined
        ? {}
        : (user.profile as Record<string, unknown>);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role === 'ADMIN' ? 'admin' : 'user',
      profile,
      linkedProviders: user.accounts.map((a) => a.provider),
    };
  }

  async patchMe(userId: string, dto: PatchMeDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.displayName !== undefined) {
      data.displayName = dto.displayName;
    }
    if (dto.profile !== undefined) {
      data.profile = dto.profile as Prisma.InputJsonValue;
    }

    if (Object.keys(data).length === 0) {
      return this.getMe(userId);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getMe(userId);
  }
}
