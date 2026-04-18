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
  all_day: 'ALL_DAY',
  am: 'AM',
  pm: 'PM',
};

const periodToApi: Record<PlanPeriod, string> = {
  ALL_DAY: 'all_day',
  AM: 'am',
  PM: 'pm',
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
      let plan = await tx.weekPlan.findUnique({
        where: { userId_weekStart: { userId, weekStart } },
      });
      if (!plan) {
        plan = await tx.weekPlan.create({
          data: { userId, weekStart },
        });
      }

      const existingSlots = await tx.planSlot.findMany({
        where: { weekPlanId: plan.id },
      });
      const existingById = new Map(existingSlots.map((s) => [s.id, s]));
      const keptIds = new Set<string>();

      for (const s of dto.slots) {
        const data = {
          dayOfWeek: s.dayOfWeek,
          period: periodToDb[s.period],
          label: s.label,
          sortOrder: s.sortOrder,
        };
        if (s.id && existingById.has(s.id)) {
          await tx.planSlot.update({
            where: { id: s.id },
            data,
          });
          keptIds.add(s.id);
        } else {
          const created = await tx.planSlot.create({
            data: { weekPlanId: plan.id, ...data },
          });
          keptIds.add(created.id);
        }
      }

      const toRemove = existingSlots.filter((ex) => !keptIds.has(ex.id));
      if (toRemove.length > 0) {
        await tx.planSlot.deleteMany({
          where: {
            weekPlanId: plan.id,
            id: { in: toRemove.map((r) => r.id) },
          },
        });
      }
    });

    return this.getWeek(userId, weekStart);
  }
}
