import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseYmdToUtcDate } from '../common/utils/date-parse';
import { PutFoodDayDto } from './dto/put-food-day.dto';

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
    await this.prisma.foodMonthBudget.upsert({
      where: { userId_yearMonth: { userId, yearMonth } },
      create: { userId, yearMonth, budgetAmount },
      update: { budgetAmount },
    });
    return this.getMonth(userId, yearMonth);
  }

  async getDays(userId: string, yearMonth: string) {
    assertYearMonth(yearMonth);
    const { start, end } = monthRangeUtc(yearMonth);

    const rows = await this.prisma.foodDaySpend.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    return {
      items: rows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        amount: r.amount,
        memo: r.memo,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async putDay(
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

    const row = await this.prisma.foodDaySpend.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        amount: dto.amount,
        memo: dto.memo,
      },
      update: {
        amount: dto.amount,
        memo: dto.memo,
      },
    });

    return {
      date: row.date.toISOString().slice(0, 10),
      amount: row.amount,
      memo: row.memo,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
