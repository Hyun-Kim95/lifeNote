import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuoteBannersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    const now = new Date();
    const items = await this.prisma.quoteBanner.findMany({
      where: {
        active: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });
    return {
      items: items.map((b) => ({
        id: b.id,
        text: b.text,
        source: b.source,
        priority: b.priority,
      })),
    };
  }
}
