import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addMonthsYearMonthUtc,
  currentYearMonthUtc,
  parseYmdToUtcDate,
} from '../common/utils/date-parse';
import { PutFoodDayDto } from './dto/put-food-day.dto';
import { isFoodDayCategory } from './food-day-category';

/** 수정 월 포함, 그 다음 달부터 같은 예산을 연속 적용하는 횟수(0~36 → 총 37개월) */
const BUDGET_CASCADE_LAST_OFFSET = 36;

function assertYearMonth(ym: string): void {
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'yearMonth는 YYYY-MM 형식이어야 합니다.',
    });
  }
}

function monthRangeUtc(yearMonth: string): { start: Date; end: Date } {
  const [Y, M] = yearMonth.split('-').map(Number);
  const start = new Date(Date.UTC(Y, M - 1, 1));
  const end = new Date(Date.UTC(Y, M, 0));
  return { start, end };
}

function encodeDaysCursor(row: { date: Date; createdAt: Date; id: string }): string {
  return `${row.date.toISOString().slice(0, 10)}|${row.createdAt.toISOString()}|${row.id}`;
}

function decodeDaysCursor(cursor: string): { date: Date; createdAt: Date; id: string } {
  const [dateStr, createdAtIso, id] = cursor.split('|');
  if (!dateStr || !createdAtIso || !id) {
    throw new Error('invalid_cursor');
  }
  const date = parseYmdToUtcDate(dateStr);
  const createdAt = new Date(createdAtIso);
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error('invalid_cursor');
  }
  return { date, createdAt, id };
}

@Injectable()
export class FoodBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonth(userId: string, yearMonth: string) {
    assertYearMonth(yearMonth);
    const { start, end } = monthRangeUtc(yearMonth);

    const [row, agg] = await Promise.all([
      this.prisma.foodMonthBudget.findUnique({
        where: { userId_yearMonth: { userId, yearMonth } },
      }),
      this.prisma.foodDaySpend.aggregate({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

    const budgetAmount = row?.budgetAmount ?? 0;
    const spentAmount = agg._sum.amount ?? 0;
    const remainingAmount = budgetAmount - spentAmount;

    return {
      yearMonth,
      budgetAmount,
      spentAmount,
      remainingAmount,
    };
  }

  async putMonth(userId: string, yearMonth: string, budgetAmount: number) {
    assertYearMonth(yearMonth);
    const currentYm = currentYearMonthUtc();
    if (yearMonth < currentYm) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '과거 월 예산은 수정할 수 없습니다.',
      });
    }
    for (let i = 0; i <= BUDGET_CASCADE_LAST_OFFSET; i++) {
      const ym = addMonthsYearMonthUtc(yearMonth, i);
      await this.prisma.foodMonthBudget.upsert({
        where: { userId_yearMonth: { userId, yearMonth: ym } },
        create: { userId, yearMonth: ym, budgetAmount },
        update: { budgetAmount },
      });
    }
    return this.getMonth(userId, yearMonth);
  }

  async getDays(
    userId: string,
    yearMonth: string,
    options?: {
      category?: string;
      limit?: number;
      cursor?: string;
    },
  ) {
    assertYearMonth(yearMonth);
    const { start, end } = monthRangeUtc(yearMonth);
    const rawLimit = options?.limit ?? 20;
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 20, 1), 50);
    const category = (options?.category ?? 'all').toLowerCase();
    if (category !== 'all' && !isFoodDayCategory(category)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'category는 all 또는 허용된 카테고리 값이어야 합니다.',
      });
    }

    const where: Prisma.FoodDaySpendWhereInput = {
      userId,
      date: { gte: start, lte: end },
      ...(category !== 'all' ? { category } : {}),
    };
    if (options?.cursor?.trim()) {
      const cur = options.cursor.trim();
      try {
        const parsed = decodeDaysCursor(cur);
        where.OR = [
          { date: { lt: parsed.date } },
          {
            date: parsed.date,
            OR: [
              { createdAt: { lt: parsed.createdAt } },
              { createdAt: parsed.createdAt, id: { lt: parsed.id } },
            ],
          },
        ];
      } catch {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'cursor 형식이 올바르지 않습니다.',
        });
      }
    }

    const rows = await this.prisma.foodDaySpend.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && page.length > 0
        ? encodeDaysCursor(page[page.length - 1])
        : null;

    return {
      items: page.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        amount: r.amount,
        memo: r.memo,
        category: r.category,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      nextCursor,
    };
  }

  async createDay(
    userId: string,
    yearMonth: string,
    dateStr: string,
    dto: PutFoodDayDto,
  ) {
    assertYearMonth(yearMonth);
    if (!dateStr.startsWith(yearMonth)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'date는 해당 yearMonth에 속해야 합니다.',
      });
    }
    const date = parseYmdToUtcDate(dateStr);

    const category =
      dto.category != null && isFoodDayCategory(dto.category) ? dto.category : 'other';

    const row = await this.prisma.foodDaySpend.create({
      data: {
        userId,
        date,
        amount: dto.amount,
        memo: dto.memo,
        category,
      },
    });

    return {
      id: row.id,
      date: row.date.toISOString().slice(0, 10),
      amount: row.amount,
      memo: row.memo,
      category: row.category,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateDayById(userId: string, dayId: string, dto: PutFoodDayDto) {
    const row = await this.prisma.foodDaySpend.findFirst({
      where: { id: dayId, userId },
      select: { category: true },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '해당 지출 기록이 없습니다.',
      });
    }
    const category =
      dto.category != null && isFoodDayCategory(dto.category) ? dto.category : row.category;
    const updated = await this.prisma.foodDaySpend.update({
      where: { id: dayId },
      data: {
        amount: dto.amount,
        memo: dto.memo,
        category,
      },
    });
    return {
      id: updated.id,
      date: updated.date.toISOString().slice(0, 10),
      amount: updated.amount,
      memo: updated.memo,
      category: updated.category,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteDayById(userId: string, dayId: string) {
    const res = await this.prisma.foodDaySpend.deleteMany({
      where: { userId, id: dayId },
    });
    if (res.count === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '해당 지출 기록이 없습니다.',
      });
    }
  }
}
