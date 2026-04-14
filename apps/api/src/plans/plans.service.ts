import { BadRequestException, Injectable } from '@nestjs/common';
import { PlanPeriod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isUtcMonday,
  parseYmdToUtcDate,
  weekEndMondayUtc,
} from '../common/utils/date-parse';
import { PutWeekPlanDto } from './dto/put-week-plan.dto';

const periodToDb: Record<string, PlanPeriod> = {
  morning: 'MORNING',
  forenoon: 'FORENOON',
  afternoon: 'AFTERNOON',
  evening: 'EVENING',
};

const periodToApi: Record<PlanPeriod, string> = {
  MORNING: 'morning',
  FORENOON: 'forenoon',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
};

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  private assertWeekStart(weekStart: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'weekStart는 YYYY-MM-DD 형식이어야 합니다.',
      });
    }
    try {
      parseYmdToUtcDate(weekStart);
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'weekStart 날짜가 올바르지 않습니다.',
      });
    }
    if (!isUtcMonday(weekStart)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'weekStart는 해당 주 월요일이어야 합니다.',
      });
    }
  }

  async getWeek(userId: string, weekStart: string) {
    this.assertWeekStart(weekStart);

    const plan = await this.prisma.weekPlan.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
      include: {
        slots: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { sortOrder: 'asc' },
            { id: 'asc' },
          ],
        },
      },
    });

    const weekEnd = weekEndMondayUtc(weekStart);

    if (!plan) {
      return {
        weekStart,
        weekEnd,
        slots: [],
      };
    }

    return {
      weekStart,
      weekEnd,
      slots: plan.slots.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        period: periodToApi[s.period],
        label: s.label,
        sortOrder: s.sortOrder,
      })),
    };
  }

  async putWeek(userId: string, weekStart: string, dto: PutWeekPlanDto) {
    this.assertWeekStart(weekStart);

    await this.prisma.$transaction(async (tx) => {
      await tx.weekPlan.deleteMany({
        where: { userId, weekStart },
      });

      if (dto.slots.length === 0) {
        return;
      }

      await tx.weekPlan.create({
        data: {
          userId,
          weekStart,
          slots: {
            create: dto.slots.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              period: periodToDb[s.period],
              label: s.label,
              sortOrder: s.sortOrder,
            })),
          },
        },
      });
    });

    return this.getWeek(userId, weekStart);
  }
}
