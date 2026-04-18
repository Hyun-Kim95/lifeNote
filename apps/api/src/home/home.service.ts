import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  parseYmdToUtcDate,
  todayYmdUtc,
  yearMonthFromYmd,
} from '../common/utils/date-parse';
import { FoodBudgetService } from '../budgets/food-budget.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly food: FoodBudgetService,
  ) {}

  async summary(userId: string, dateParam?: string) {
    let dateStr: string;
    if (dateParam) {
      try {
        parseYmdToUtcDate(dateParam);
        dateStr = dateParam;
      } catch {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'date는 YYYY-MM-DD 형식이어야 합니다.',
        });
      }
    } else {
      dateStr = todayYmdUtc();
    }
    const date = parseYmdToUtcDate(dateStr);
    const ym = yearMonthFromYmd(dateStr);
    const now = new Date();

    const quote = await this.prisma.quoteBanner.findFirst({
      where: {
        active: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });

    const [totalTodos, completedTodos, month, todaySpendAgg] = await Promise.all([
      this.prisma.todo.count({ where: { userId } }),
      this.prisma.todo.count({ where: { userId, done: true } }),
      this.food.getMonth(userId, ym),
      this.prisma.foodDaySpend.aggregate({
        where: { userId, date },
        _sum: { amount: true },
      }),
    ]);

    const percent =
      totalTodos > 0
        ? Math.round((completedTodos / totalTodos) * 100)
        : 0;

    return {
      date: dateStr,
      quoteBanner: quote
        ? { id: quote.id, text: quote.text, source: quote.source }
        : null,
      todo: {
        completed: completedTodos,
        total: totalTodos,
        percent,
      },
      foodBudget: {
        yearMonth: ym,
        budgetAmount: month.budgetAmount,
        spentAmount: month.spentAmount,
        remainingAmount: month.remainingAmount,
        todaySpentAmount: todaySpendAgg._sum.amount ?? 0,
      },
    };
  }
}
