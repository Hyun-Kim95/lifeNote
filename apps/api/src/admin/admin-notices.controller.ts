import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Notice, NoticeStatus, Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNoticeListQueryDto } from './dto/admin-notice-list.query';
import { CreateAdminNoticeDto, PatchAdminNoticeDto } from './dto/notice-admin.dto';

const toApiStatus: Record<NoticeStatus, string> = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ENDED: 'ended',
};

@Controller('admin/notices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminNoticesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: AdminNoticeListQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 15));
    const now = new Date();
    const where: Prisma.NoticeWhereInput = {};
    if (q.status === 'draft') {
      where.status = NoticeStatus.DRAFT;
    } else if (q.status === 'scheduled') {
      where.status = { not: NoticeStatus.DRAFT };
      where.publishStartAt = { gt: now };
    } else if (q.status === 'published') {
      where.status = { not: NoticeStatus.DRAFT };
      where.AND = [
        { OR: [{ publishStartAt: null }, { publishStartAt: { lte: now } }] },
        { OR: [{ publishEndAt: null }, { publishEndAt: { gte: now } }] },
      ];
    } else if (q.status === 'ended') {
      where.status = { not: NoticeStatus.DRAFT };
      where.publishEndAt = { lt: now };
    }
    if (q.pinned !== undefined) {
      where.pinned = q.pinned;
    }
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { body: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.startDate || q.endDate) {
      where.publishStartAt = {};
      if (q.startDate) where.publishStartAt.gte = this.parseIsoStrict(q.startDate);
      if (q.endDate) where.publishStartAt.lte = this.parseIsoStrict(q.endDate);
    }

    const [totalCount, rows] = await Promise.all([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((n) => ({
        id: n.id,
        title: n.title,
        pinned: n.pinned,
        publishStartAt: n.publishStartAt?.toISOString() ?? null,
        publishEndAt: n.publishEndAt?.toISOString() ?? null,
        status: this.resolveApiStatus(n, now),
      })),
      page,
      pageSize,
      totalCount,
    };
  }

  @Post()
  async create(@Body() dto: CreateAdminNoticeDto) {
    const now = new Date();
    const publishStartAt = this.parseIso(dto.publishStartAt);
    const publishEndAt = this.parseIso(dto.publishEndAt);
    const row = await this.prisma.notice.create({
      data: {
        title: dto.title,
        body: dto.body,
        pinned: dto.pinned ?? false,
        status: dto.isDraft
          ? NoticeStatus.DRAFT
          : this.resolveNoticeStatus(publishStartAt, publishEndAt, now),
        publishStartAt,
        publishEndAt,
      },
    });
    return this.detail(row.id);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.getOr404(id);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchAdminNoticeDto) {
    const base = await this.prisma.notice.findUnique({ where: { id } });
    if (!base) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '공지를 찾을 수 없습니다.',
      });
    }
    const data: Prisma.NoticeUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.pinned !== undefined) data.pinned = dto.pinned;
    if (dto.publishStartAt !== undefined) data.publishStartAt = this.parseIso(dto.publishStartAt);
    if (dto.publishEndAt !== undefined) data.publishEndAt = this.parseIso(dto.publishEndAt);
    if (dto.isDraft !== undefined) {
      data.status = dto.isDraft
        ? NoticeStatus.DRAFT
        : this.resolveNoticeStatus(
            dto.publishStartAt !== undefined ? this.parseIso(dto.publishStartAt) : base.publishStartAt,
            dto.publishEndAt !== undefined ? this.parseIso(dto.publishEndAt) : base.publishEndAt,
            new Date(),
          );
    } else if (base.status !== NoticeStatus.DRAFT) {
      data.status = this.resolveNoticeStatus(
        dto.publishStartAt !== undefined ? this.parseIso(dto.publishStartAt) : base.publishStartAt,
        dto.publishEndAt !== undefined ? this.parseIso(dto.publishEndAt) : base.publishEndAt,
        new Date(),
      );
    }
    await this.prisma.notice.update({ where: { id }, data });
    return this.detail(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.getOr404(id);
    await this.prisma.notice.delete({ where: { id } });
  }

  private async getOr404(id: string) {
    const n = await this.prisma.notice.findUnique({ where: { id } });
    if (!n) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '공지를 찾을 수 없습니다.',
      });
    }
    return {
      id: n.id,
      title: n.title,
      body: n.body,
      pinned: n.pinned,
      publishStartAt: n.publishStartAt?.toISOString() ?? null,
      publishEndAt: n.publishEndAt?.toISOString() ?? null,
      status: this.resolveApiStatus(n),
      isDraft: n.status === NoticeStatus.DRAFT,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  }

  private resolveNoticeStatus(
    publishStartAt: Date | null | undefined,
    publishEndAt: Date | null | undefined,
    now: Date,
  ): NoticeStatus {
    if (publishStartAt && publishStartAt.getTime() > now.getTime()) {
      return NoticeStatus.SCHEDULED;
    }
    if (publishEndAt && publishEndAt.getTime() < now.getTime()) {
      return NoticeStatus.ENDED;
    }
    return NoticeStatus.PUBLISHED;
  }

  private resolveApiStatus(notice: Notice, now: Date = new Date()) {
    if (notice.status === NoticeStatus.DRAFT) {
      return toApiStatus[NoticeStatus.DRAFT];
    }
    return toApiStatus[
      this.resolveNoticeStatus(notice.publishStartAt, notice.publishEndAt, now)
    ];
  }

  private parseIso(v?: string): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === '') return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'publishedAt은 ISO 날짜여야 합니다.',
      });
    }
    return d;
  }

  private parseIsoStrict(v: string): Date {
    const d = this.parseIso(v);
    if (!d) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '날짜는 ISO 형식이어야 합니다.',
      });
    }
    return d;
  }
}
