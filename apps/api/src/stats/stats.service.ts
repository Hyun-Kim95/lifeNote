import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseYmdToUtcDate, todayYmdUtc, yearMonthFromYmd } from '../common/utils/date-parse';
import { StatsSummaryQueryDto } from './dto/stats-summary.query';

type RangeType = 'week' | 'month' | 'year';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, query: StatsSummaryQueryDto) {
    const range: RangeType = query.range ?? 'week';
    const anchorStr = query.anchor ?? todayYmdUtc();
    const anchor = this.parseAnchor(anchorStr);
    const window = this.buildWindow(range, anchor);

    const [todoTotal, todoDone, diariesWritten, foodAgg, monthBudget] = await Promise.all([
      this.prisma.todo.count({
        where: { userId, createdAt: { gte: window.start, lte: window.end } },
      }),
      this.prisma.todo.count({
        where: { userId, done: true, createdAt: { gte: window.start, lte: window.end } },
      }),
      this.prisma.diary.count({
        where: { userId, date: { gte: window.start, lte: window.end } },
      }),
      this.prisma.foodDaySpend.aggregate({
        where: { userId, date: { gte: window.start, lte: window.end } },
        _sum: { amount: true },
      }),
      this.prisma.foodMonthBudget.findUnique({
        where: { userId_yearMonth: { userId, yearMonth: yearMonthFromYmd(anchorStr) } },
      }),
    ]);

    return {
      range,
      todo: {
        completionRate: todoTotal > 0 ? Number((todoDone / todoTotal).toFixed(2)) : 0,
        completed: todoDone,
        total: todoTotal,
      },
      diary: {
        daysWritten: diariesWritten,
      },
      food: {
        totalSpent: foodAgg._sum.amount ?? 0,
        budgetAmount: monthBudget?.budgetAmount ?? 0,
      },
    };
  }

  private parseAnchor(anchor: string): Date {
    try {
      return parseYmdToUtcDate(anchor);
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'anchor는 YYYY-MM-DD 형식이어야 합니다.',
      });
    }
  }

  private buildWindow(range: RangeType, anchor: Date): { start: Date; end: Date } {
    const start = new Date(anchor);
    const end = new Date(anchor);

    if (range === 'week') {
      const day = start.getUTCDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setUTCDate(start.getUTCDate() + diffToMonday);
      start.setUTCHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setUTCDate(end.getUTCDate() + 6);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    }

    if (range === 'month') {
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);

      end.setUTCMonth(end.getUTCMonth() + 1, 0);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    }

    start.setUTCMonth(0, 1);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCMonth(11, 31);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
