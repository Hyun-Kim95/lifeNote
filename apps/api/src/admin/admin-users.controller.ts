import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUsersListQueryDto, PatchAdminUserDto } from './dto/user-admin.dto';

const toDbStatus: Record<string, UserStatus> = {
  active: UserStatus.ACTIVE,
  suspended: UserStatus.SUSPENDED,
};

const toApiStatus: Record<UserStatus, string> = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: AdminUsersListQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 15));

    const where: Prisma.UserWhereInput = {};
    if (q.search) {
      where.OR = [
        { email: { contains: q.search, mode: 'insensitive' } },
        { displayName: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.status) {
      where.status = toDbStatus[q.status];
    }

    const [totalCount, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { accounts: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role === 'ADMIN' ? 'admin' : 'user',
        status: toApiStatus[u.status],
        linkedProviders: u.accounts.map((a) => a.provider),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      page,
      pageSize,
      totalCount,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.getOr404(id);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchAdminUserDto) {
    await this.getOr404(id);
    const data: Prisma.UserUpdateInput = {};
    if (dto.status !== undefined) data.status = toDbStatus[dto.status];
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    await this.prisma.user.update({ where: { id }, data });
    return this.getOr404(id);
  }

  private async getOr404(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
    if (!u) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '사용자를 찾을 수 없습니다.',
      });
    }
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role === 'ADMIN' ? 'admin' : 'user',
      status: toApiStatus[u.status],
      linkedProviders: u.accounts.map((a) => a.provider),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }
}
