import { Injectable, NotFoundException } from '@nestjs/common';
import { NoticeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListNoticesQueryDto } from './dto/list-notices.query';

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListNoticesQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 20));
    const pinnedFirst = q.pinnedFirst ?? true;
    const now = new Date();

    const where: Prisma.NoticeWhereInput = {
      status: { not: NoticeStatus.DRAFT },
      OR: [{ publishEndAt: null }, { publishEndAt: { gte: now } }],
      AND: [{ OR: [{ publishStartAt: null }, { publishStartAt: { lte: now } }] }],
    };

    const [totalCount, rows] = await Promise.all([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        orderBy: pinnedFirst
          ? [{ pinned: 'desc' }, { publishStartAt: 'desc' }]
          : [{ publishStartAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((n) => ({
        id: n.id,
        title: n.title,
        pinned: n.pinned,
        publishedAt: n.publishStartAt?.toISOString() ?? null,
        status: 'published' as const,
      })),
      page,
      pageSize,
      totalCount,
    };
  }

  async getById(id: string) {
    const now = new Date();
    const n = await this.prisma.notice.findFirst({
      where: {
        id,
        status: { not: NoticeStatus.DRAFT },
        OR: [{ publishEndAt: null }, { publishEndAt: { gte: now } }],
        AND: [{ OR: [{ publishStartAt: null }, { publishStartAt: { lte: now } }] }],
      },
    });
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
      publishedAt: n.publishStartAt?.toISOString() ?? null,
      status: 'published' as const,
    };
  }
}
