import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Todo,
  TodoDayPeriod,
  TodoPriority,
  TodoScheduleType as TodoScheduleTypeDb,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  eachUtcMidnightInMonth,
  eachUtcMidnightInWeekFromMonday,
  isUtcMonday,
  parseYmdToUtcDate,
} from '../common/utils/date-parse';
import {
  CreateTodoDto,
  TodoScheduleType,
} from './dto/create-todo.dto';
import { ListTodosQueryDto } from './dto/list-todos.query';
import { PatchTodoDto } from './dto/patch-todo.dto';

const priorityToDb: Record<string, TodoPriority> = {
  low: 'LOW',
  normal: 'NORMAL',
  high: 'HIGH',
};

const priorityToApi: Record<TodoPriority, string> = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
};

const scheduleTypeToDb: Record<TodoScheduleType, TodoScheduleTypeDb> = {
  once: 'ONCE',
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  interval: 'INTERVAL',
  someday: 'SOMEDAY',
};

const scheduleTypeToApi: Record<TodoScheduleTypeDb, TodoScheduleType> = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  INTERVAL: 'interval',
  SOMEDAY: 'someday',
};

const dayPeriodToDb: Record<string, TodoDayPeriod> = {
  all_day: 'ALL_DAY',
  am: 'AM',
  pm: 'PM',
};

const dayPeriodToApi: Record<TodoDayPeriod, string> = {
  ALL_DAY: 'all_day',
  AM: 'am',
  PM: 'pm',
};

type ScheduleRuleInput = {
  scheduleType: TodoScheduleType;
  startDate: string | null;
  endDate: string | null;
  weekdays: number[];
  monthDay: number | null;
  intervalDays: number | null;
};

function ymd(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function utcWeekdayMondayOneBased(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

function daysBetweenUtc(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / 86_400_000);
}

function parseDueAtIso(raw: string): Date {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'dueAt은 유효한 ISO 8601 날짜·시각이어야 합니다.',
    });
  }
  return d;
}

function assertScheduleRuleInput(input: ScheduleRuleInput): void {
  if (input.scheduleType === 'someday') {
    return;
  }
  if (input.startDate && input.endDate) {
    const start = parseYmdToUtcDate(input.startDate);
    const end = parseYmdToUtcDate(input.endDate);
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException({
        code: 'INVALID_TODO_SCHEDULE',
        message: 'startDate는 endDate보다 늦을 수 없습니다.',
      });
    }
  }

  if (input.scheduleType === 'weekly' && input.weekdays.length === 0) {
    throw new BadRequestException({
      code: 'INVALID_TODO_SCHEDULE',
      message: 'weekly 반복에는 weekdays가 필요합니다.',
    });
  }
  if (input.scheduleType === 'once' && !input.startDate) {
    throw new BadRequestException({
      code: 'INVALID_TODO_SCHEDULE',
      message: 'once 일정에는 날짜(startDate/dueOn/dueAt)가 필요합니다.',
    });
  }
  if (input.scheduleType === 'monthly' && !input.monthDay) {
    throw new BadRequestException({
      code: 'INVALID_TODO_SCHEDULE',
      message: 'monthly 반복에는 monthDay가 필요합니다.',
    });
  }
  if (
    input.scheduleType === 'interval' &&
    (!input.intervalDays || !input.startDate)
  ) {
    throw new BadRequestException({
      code: 'INVALID_TODO_SCHEDULE',
      message: 'interval 반복에는 startDate와 intervalDays가 필요합니다.',
    });
  }
}

function normalizeScheduleRuleInput(input: ScheduleRuleInput): ScheduleRuleInput {
  const normalized: ScheduleRuleInput = {
    scheduleType: input.scheduleType,
    startDate: input.startDate,
    endDate: input.endDate,
    weekdays: input.weekdays,
    monthDay: input.monthDay,
    intervalDays: input.intervalDays,
  };

  if (normalized.scheduleType === 'someday') {
    normalized.startDate = null;
    normalized.endDate = null;
    normalized.weekdays = [];
    normalized.monthDay = null;
    normalized.intervalDays = null;
    return normalized;
  }

  if (normalized.scheduleType !== 'weekly') {
    normalized.weekdays = [];
  }
  if (normalized.scheduleType !== 'monthly') {
    normalized.monthDay = null;
  }
  if (normalized.scheduleType !== 'interval') {
    normalized.intervalDays = null;
  }

  return normalized;
}

function isTodoScheduledOnDate(todo: Todo, targetDate: Date): boolean {
  const start = todo.startDate;
  const end = todo.endDate;
  if (start && targetDate.getTime() < start.getTime()) {
    return false;
  }
  if (end && targetDate.getTime() > end.getTime()) {
    return false;
  }

  switch (todo.scheduleType) {
    case 'SOMEDAY':
      return true;
    case 'ONCE': {
      const base = todo.startDate ?? todo.dueOn;
      if (!base) {
        return false;
      }
      return base.getTime() === targetDate.getTime();
    }
    case 'DAILY':
      return true;
    case 'WEEKLY': {
      const weekday = utcWeekdayMondayOneBased(targetDate);
      return todo.weekdays.includes(weekday);
    }
    case 'MONTHLY':
      return todo.monthDay === targetDate.getUTCDate();
    case 'INTERVAL': {
      if (!todo.startDate || !todo.intervalDays || todo.intervalDays <= 0) {
        return false;
      }
      const diff = daysBetweenUtc(todo.startDate, targetDate);
      return diff >= 0 && diff % todo.intervalDays === 0;
    }
    default:
      return false;
  }
}

/** 미완료: 이른 dueAt 우선(dueAt 없음은 맨 아래)·동일 dueAt이면 timeLocal(HH:mm) 오름(null 맨 뒤)·우선순위·createdAt. 완료는 하단·updatedAt 최신 우선 */
const prioritySortRank: Record<TodoPriority, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
};

const TIME_LOCAL_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeTimeLocalInput(raw: string | undefined | null): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  const s = raw.trim();
  if (s === '') {
    return null;
  }
  if (!TIME_LOCAL_RE.test(s)) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'timeLocal은 HH:mm 형식(00:00~23:59)이어야 합니다.',
    });
  }
  return s;
}

/** 동일 dueAt일 때: timeLocal 오름차순, 둘 다 없으면 0, 한쪽만 없으면 없는 쪽이 뒤 */
function compareTimeLocalForSort(a: string | null, b: string | null): number {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }
  return a.localeCompare(b);
}

function sortTodosForDisplay(a: Todo, b: Todo): number {
  if (a.done !== b.done) {
    return a.done ? 1 : -1;
  }
  if (!a.done && !b.done) {
    const at = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bt = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
    if (at !== bt) {
      return at - bt;
    }
    const tl = compareTimeLocalForSort(a.timeLocal, b.timeLocal);
    if (tl !== 0) {
      return tl;
    }
    const pr = prioritySortRank[a.priority] - prioritySortRank[b.priority];
    if (pr !== 0) {
      return pr;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  }
  const au = a.updatedAt.getTime();
  const bu = b.updatedAt.getTime();
  if (au !== bu) {
    return bu - au;
  }
  return a.id.localeCompare(b.id);
}

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapTodo(t: Todo) {
    return {
      id: t.id,
      title: t.title,
      dueOn: ymd(t.dueOn),
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
      priority: priorityToApi[t.priority],
      scheduleType: scheduleTypeToApi[t.scheduleType],
      startDate: ymd(t.startDate),
      endDate: ymd(t.endDate),
      weekdays: t.weekdays,
      monthDay: t.monthDay,
      intervalDays: t.intervalDays,
      done: t.done,
      dayPeriod: t.dayPeriod ? dayPeriodToApi[t.dayPeriod] : null,
      timeLocal: t.timeLocal ?? null,
      planSlotId: t.planSlotId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private paginateFilteredTodos(
    filtered: Todo[],
    limit: number,
    cursor?: string,
  ) {
    filtered.sort(sortTodosForDisplay);
    const total = filtered.length;
    const completed = filtered.filter((todo) => todo.done).length;

    let afterCursor = filtered;
    if (cursor) {
      const cursorIndex = filtered.findIndex((todo) => todo.id === cursor);
      if (cursorIndex >= 0) {
        afterCursor = filtered.slice(cursorIndex + 1);
      }
    }

    const page = afterCursor.slice(0, limit);
    const hasMore = afterCursor.length > limit;
    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      items: page.map((t) => this.mapTodo(t)),
      nextCursor,
      stats: { completed, total },
    };
  }

  private buildFilter(
    userId: string,
    q: ListTodosQueryDto,
  ): Prisma.TodoWhereInput {
    const where: Prisma.TodoWhereInput = { userId };
    const status = q.status ?? 'all';
    if (status === 'open') {
      where.done = false;
    } else if (status === 'done') {
      where.done = true;
    }
    if (q.dueOn) {
      where.dueOn = parseYmdToUtcDate(q.dueOn);
    }
    return where;
  }

  async list(userId: string, q: ListTodosQueryDto) {
    const limit = Math.min(100, Math.max(1, q.limit ?? 50));
    const whereBase = this.buildFilter(userId, q);

    const scopeKeys = [q.date, q.weekStart, q.yearMonth].filter(Boolean);
    if (scopeKeys.length > 1) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'date, weekStart, yearMonth 중 하나만 지정할 수 있습니다.',
      });
    }

    let rangeDays: Date[] | null = null;
    if (q.weekStart) {
      try {
        parseYmdToUtcDate(q.weekStart);
      } catch {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'weekStart 날짜가 올바르지 않습니다.',
        });
      }
      if (!isUtcMonday(q.weekStart)) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'weekStart는 해당 주 월요일(UTC)이어야 합니다.',
        });
      }
      rangeDays = eachUtcMidnightInWeekFromMonday(q.weekStart);
    } else if (q.yearMonth) {
      try {
        rangeDays = eachUtcMidnightInMonth(q.yearMonth);
      } catch {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'yearMonth는 YYYY-MM 형식의 유효한 달이어야 합니다.',
        });
      }
    }

    const targetDate = q.date ? parseYmdToUtcDate(q.date) : null;

    if (targetDate || rangeDays) {
      const allRows = await this.prisma.todo.findMany({
        where: whereBase,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      let filtered: Todo[];
      if (targetDate) {
        filtered = allRows.filter((todo) =>
          isTodoScheduledOnDate(todo, targetDate),
        );
      } else {
        filtered = allRows.filter((todo) =>
          rangeDays!.some((day) => isTodoScheduledOnDate(todo, day)),
        );
      }

      return this.paginateFilteredTodos(filtered, limit, q.cursor);
    }

    const [total, completed] = await Promise.all([
      this.prisma.todo.count({ where: whereBase }),
      this.prisma.todo.count({ where: { ...whereBase, done: true } }),
    ]);

    let where: Prisma.TodoWhereInput = { ...whereBase };
    if (q.cursor) {
      const cur = await this.prisma.todo.findFirst({
        where: { id: q.cursor, userId },
      });
      if (cur) {
        where = {
          AND: [
            whereBase,
            {
              OR: [
                { createdAt: { lt: cur.createdAt } },
                {
                  AND: [
                    { createdAt: cur.createdAt },
                    { id: { lt: cur.id } },
                  ],
                },
              ],
            },
          ],
        };
      }
    }

    const rows = await this.prisma.todo.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const sorted = [...rows].sort(sortTodosForDisplay);
    const hasMore = sorted.length > limit;
    const page = hasMore ? sorted.slice(0, limit) : sorted;
    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      items: page.map((t) => this.mapTodo(t)),
      nextCursor,
      stats: { completed, total },
    };
  }

  async create(userId: string, dto: CreateTodoDto) {
    const priority = priorityToDb[dto.priority ?? 'normal'] ?? 'NORMAL';
    const scheduleType = dto.scheduleType ?? 'once';
    let inferredStart = dto.startDate ?? dto.dueOn ?? null;
    if (!inferredStart && dto.dueAt) {
      inferredStart = new Date(dto.dueAt).toISOString().slice(0, 10);
    }
    const scheduleInput = normalizeScheduleRuleInput({
      scheduleType,
      startDate: inferredStart,
      endDate: dto.endDate ?? null,
      weekdays: dto.weekdays ?? [],
      monthDay: dto.monthDay ?? null,
      intervalDays: dto.intervalDays ?? null,
    });
    assertScheduleRuleInput(scheduleInput);

    let planSlotId: string | null = null;
    const rawPlanSlotId = dto.planSlotId?.trim();
    if (rawPlanSlotId) {
      const slot = await this.prisma.planSlot.findFirst({
        where: {
          id: rawPlanSlotId,
          weekPlan: { userId },
        },
      });
      if (!slot) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'planSlotId가 유효하지 않거나 접근할 수 없습니다.',
        });
      }
      planSlotId = slot.id;
    }

    if (scheduleInput.scheduleType === 'someday' && dto.dueAt) {
      throw new BadRequestException({
        code: 'INVALID_TODO_SCHEDULE',
        message: '언젠가(someday) 일정에는 시각(dueAt)을 지정할 수 없습니다.',
      });
    }

    const timeLocalNorm = normalizeTimeLocalInput(dto.timeLocal ?? null);
    if (scheduleInput.scheduleType === 'someday' && timeLocalNorm) {
      throw new BadRequestException({
        code: 'INVALID_TODO_SCHEDULE',
        message: '언젠가(someday) 일정에는 timeLocal을 지정할 수 없습니다.',
      });
    }
    if (scheduleInput.scheduleType === 'once' && timeLocalNorm) {
      throw new BadRequestException({
        code: 'INVALID_TODO_SCHEDULE',
        message: '특정 날짜(once) 일정은 timeLocal 대신 dueAt으로 시각을 지정하세요.',
      });
    }

    let dueAtVal: Date | null = null;
    if (scheduleInput.scheduleType === 'someday') {
      dueAtVal = null;
    } else if (dto.dueAt) {
      if (scheduleInput.scheduleType !== 'once') {
        throw new BadRequestException({
          code: 'INVALID_TODO_SCHEDULE',
          message: 'dueAt은 once(특정 날짜) 일정에서만 사용할 수 있습니다.',
        });
      }
      dueAtVal = parseDueAtIso(dto.dueAt);
    } else if (scheduleInput.scheduleType === 'once' && scheduleInput.startDate) {
      dueAtVal = parseYmdToUtcDate(scheduleInput.startDate);
    }

    let dueOnDate: Date | null = null;
    let startDateVal: Date | null = null;
    if (scheduleInput.scheduleType === 'someday') {
      dueOnDate = null;
      startDateVal = null;
    } else if (scheduleInput.scheduleType === 'once') {
      startDateVal = scheduleInput.startDate
        ? parseYmdToUtcDate(scheduleInput.startDate)
        : null;
      dueOnDate = dto.dueOn ? parseYmdToUtcDate(dto.dueOn) : startDateVal;
      if (dto.dueAt && dueAtVal) {
        const slice = dueAtVal.toISOString().slice(0, 10);
        dueOnDate = parseYmdToUtcDate(slice);
        startDateVal = dueOnDate;
      }
    } else {
      dueOnDate = dto.dueOn ? parseYmdToUtcDate(dto.dueOn) : null;
      startDateVal = scheduleInput.startDate
        ? parseYmdToUtcDate(scheduleInput.startDate)
        : null;
    }

    const dayPeriodDb =
      dto.dayPeriod != null ? dayPeriodToDb[dto.dayPeriod] : undefined;

    const timeLocalVal =
      scheduleInput.scheduleType !== 'once' &&
      scheduleInput.scheduleType !== 'someday'
        ? timeLocalNorm
        : null;

    const t = await this.prisma.todo.create({
      data: {
        userId,
        title: dto.title,
        dueAt: dueAtVal,
        dueOn: dueOnDate,
        priority,
        scheduleType: scheduleTypeToDb[scheduleInput.scheduleType],
        startDate: startDateVal,
        endDate: scheduleInput.endDate
          ? parseYmdToUtcDate(scheduleInput.endDate)
          : null,
        weekdays: scheduleInput.weekdays,
        monthDay: scheduleInput.monthDay,
        intervalDays: scheduleInput.intervalDays,
        ...(dayPeriodDb ? { dayPeriod: dayPeriodDb } : {}),
        ...(timeLocalVal ? { timeLocal: timeLocalVal } : {}),
        planSlotId,
      },
    });
    return this.mapTodo(t);
  }

  async patch(userId: string, id: string, dto: PatchTodoDto) {
    const existing = await this.prisma.todo.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '할 일을 찾을 수 없습니다.',
      });
    }

    const data: Prisma.TodoUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.dueOn !== undefined) {
      data.dueOn = dto.dueOn === null ? null : parseYmdToUtcDate(dto.dueOn);
    }
    if (dto.priority !== undefined) {
      data.priority = priorityToDb[dto.priority];
    }
    if (dto.done !== undefined) {
      data.done = dto.done;
    }
    if (dto.dayPeriod !== undefined) {
      data.dayPeriod =
        dto.dayPeriod === null ? null : dayPeriodToDb[dto.dayPeriod];
    }

    const hasSchedulePatch =
      dto.scheduleType !== undefined ||
      dto.startDate !== undefined ||
      dto.endDate !== undefined ||
      dto.weekdays !== undefined ||
      dto.monthDay !== undefined ||
      dto.intervalDays !== undefined;

    if (hasSchedulePatch) {
      const merged = normalizeScheduleRuleInput({
        scheduleType: dto.scheduleType ?? scheduleTypeToApi[existing.scheduleType],
        startDate:
          dto.startDate === undefined ? ymd(existing.startDate) : dto.startDate,
        endDate: dto.endDate === undefined ? ymd(existing.endDate) : dto.endDate,
        weekdays:
          dto.weekdays === undefined ? existing.weekdays : (dto.weekdays ?? []),
        monthDay: dto.monthDay === undefined ? existing.monthDay : dto.monthDay,
        intervalDays:
          dto.intervalDays === undefined
            ? existing.intervalDays
            : dto.intervalDays,
      });
      assertScheduleRuleInput(merged);

      const nextType = scheduleTypeToDb[merged.scheduleType];
      data.scheduleType = nextType;
      data.startDate = merged.startDate ? parseYmdToUtcDate(merged.startDate) : null;
      data.endDate = merged.endDate ? parseYmdToUtcDate(merged.endDate) : null;
      data.weekdays = merged.weekdays;
      data.monthDay = merged.monthDay;
      data.intervalDays = merged.intervalDays;

      if (merged.scheduleType === 'someday') {
        data.dueOn = null;
        data.startDate = null;
        data.endDate = null;
        data.dueAt = null;
        data.timeLocal = null;
      } else if (merged.scheduleType === 'once') {
        data.timeLocal = null;
        const midnight =
          merged.startDate != null
            ? parseYmdToUtcDate(merged.startDate)
            : null;
        if (midnight) {
          data.dueOn = midnight;
          data.startDate = midnight;
          if (dto.dueAt === undefined) {
            const prevY =
              ymd(existing.startDate) ?? ymd(existing.dueOn) ?? null;
            if (merged.startDate !== prevY) {
              data.dueAt = midnight;
            }
          }
        }
      } else {
        data.dueAt = null;
      }
    }

    if (dto.dueAt !== undefined) {
      const effectiveSt =
        (data.scheduleType as TodoScheduleTypeDb | undefined) ??
        existing.scheduleType;
      const effectiveApi = scheduleTypeToApi[effectiveSt];
      if (effectiveApi === 'someday' && dto.dueAt !== null) {
        throw new BadRequestException({
          code: 'INVALID_TODO_SCHEDULE',
          message: '언젠가(someday) 일정에는 시각(dueAt)을 지정할 수 없습니다.',
        });
      }
      if (dto.dueAt === null) {
        data.dueAt = null;
      } else {
        if (effectiveSt !== 'ONCE') {
          throw new BadRequestException({
            code: 'INVALID_TODO_SCHEDULE',
            message: 'dueAt은 once(특정 날짜) 일정에서만 사용할 수 있습니다.',
          });
        }
        const d = parseDueAtIso(dto.dueAt);
        data.dueAt = d;
        const slice = d.toISOString().slice(0, 10);
        const day = parseYmdToUtcDate(slice);
        data.dueOn = day;
        data.startDate = day;
      }
    }

    if (dto.timeLocal !== undefined) {
      const nextSt =
        (data.scheduleType as TodoScheduleTypeDb | undefined) ??
        existing.scheduleType;
      const apiSt = scheduleTypeToApi[nextSt];
      if (apiSt === 'someday' && dto.timeLocal !== null) {
        throw new BadRequestException({
          code: 'INVALID_TODO_SCHEDULE',
          message: '언젠가(someday) 일정에는 timeLocal을 지정할 수 없습니다.',
        });
      }
      if (apiSt === 'once' && dto.timeLocal !== null) {
        throw new BadRequestException({
          code: 'INVALID_TODO_SCHEDULE',
          message: '특정 날짜(once) 일정은 timeLocal 대신 dueAt으로 시각을 지정하세요.',
        });
      }
      if (dto.timeLocal === null) {
        data.timeLocal = null;
      } else {
        data.timeLocal = normalizeTimeLocalInput(dto.timeLocal);
      }
    }

    const t = await this.prisma.todo.update({
      where: { id },
      data,
    });
    return this.mapTodo(t);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.todo.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '할 일을 찾을 수 없습니다.',
      });
    }
    await this.prisma.todo.delete({ where: { id } });
  }
}
