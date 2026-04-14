import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AdminQuoteBannerListQueryDto } from './dto/admin-quote-banner-list.query';
import {
  CreateAdminQuoteBannerDto,
  PatchAdminQuoteBannerDto,
} from './dto/quote-banner-admin.dto';

@Controller('admin/quote-banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminQuoteBannersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: AdminQuoteBannerListQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 15));
    const where: Prisma.QuoteBannerWhereInput = {};
    if (q.active !== undefined) where.active = q.active;
    const [totalCount, rows] = await Promise.all([
      this.prisma.quoteBanner.count({ where }),
      this.prisma.quoteBanner.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: rows,
      page,
      pageSize,
      totalCount,
    };
  }

  @Post()
  async create(@Body() dto: CreateAdminQuoteBannerDto) {
    const row = await this.prisma.quoteBanner.create({
      data: {
        text: dto.text,
        source: dto.source ?? 'lifeNote',
        priority: dto.priority ?? 0,
        active: dto.active ?? true,
        startAt: this.parseIso(dto.startAt),
        endAt: this.parseIso(dto.endAt),
      },
    });
    return row;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchAdminQuoteBannerDto) {
    const row0 = await this.prisma.quoteBanner.findUnique({ where: { id } });
    if (!row0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '명언 배너를 찾을 수 없습니다.',
      });
    }
    const row = await this.prisma.quoteBanner.update({
      where: { id },
      data: {
        ...(dto.text !== undefined ? { text: dto.text } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.startAt !== undefined ? { startAt: this.parseIso(dto.startAt) } : {}),
        ...(dto.endAt !== undefined ? { endAt: this.parseIso(dto.endAt) } : {}),
      },
    });
    return row;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    const row = await this.prisma.quoteBanner.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '명언 배너를 찾을 수 없습니다.',
      });
    }
    await this.prisma.quoteBanner.delete({ where: { id } });
  }

  private parseIso(v?: string): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === '') return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '날짜는 ISO 형식이어야 합니다.',
      });
    }
    return d;
  }
}
