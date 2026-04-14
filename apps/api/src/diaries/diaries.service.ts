import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseYmdToUtcDate } from '../common/utils/date-parse';
import { PutDiaryDto } from './dto/put-diary.dto';

@Injectable()
export class DiariesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates() {
    const rows = await this.prisma.diaryTemplate.findMany({
      where: { active: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });
    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        schema: t.schema,
      })),
    };
  }

  async getByDate(userId: string, dateStr: string) {
    const date = this.parseDateOr400(dateStr);
    const row = await this.prisma.diary.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '해당 날짜의 일기를 찾을 수 없습니다.',
      });
    }
    return {
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      templateId: row.templateId,
      title: row.title,
      body: row.body,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async putByDate(userId: string, dateStr: string, dto: PutDiaryDto) {
    const date = this.parseDateOr400(dateStr);

    if (dto.templateId) {
      const exists = await this.prisma.diaryTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (!exists) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'templateId가 올바르지 않습니다.',
        });
      }
    }

    const row = await this.prisma.diary.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        templateId: dto.templateId,
        title: dto.title ?? null,
        body: dto.body,
      },
      update: {
        templateId: dto.templateId,
        title: dto.title ?? null,
        body: dto.body,
      },
    });

    return {
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      templateId: row.templateId,
      title: row.title,
      body: row.body,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private parseDateOr400(dateStr: string): Date {
    try {
      return parseYmdToUtcDate(dateStr);
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'date는 YYYY-MM-DD 형식이어야 합니다.',
      });
    }
  }
}
