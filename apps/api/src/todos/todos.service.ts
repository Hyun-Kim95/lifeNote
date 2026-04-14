import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Todo, TodoPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseYmdToUtcDate } from '../common/utils/date-parse';
import { CreateTodoDto } from './dto/create-todo.dto';
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

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapTodo(t: Todo) {
    return {
      id: t.id,
      title: t.title,
      dueOn: t.dueOn
        ? t.dueOn.toISOString().slice(0, 10)
        : null,
      priority: priorityToApi[t.priority],
      done: t.done,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
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

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      items: page.map((t) => this.mapTodo(t)),
      nextCursor,
      stats: { completed, total },
    };
  }

  async create(userId: string, dto: CreateTodoDto) {
    const priority =
      priorityToDb[dto.priority ?? 'normal'] ?? 'NORMAL';
    const t = await this.prisma.todo.create({
      data: {
        userId,
        title: dto.title,
        dueOn: dto.dueOn ? parseYmdToUtcDate(dto.dueOn) : null,
        priority,
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
      data.dueOn =
        dto.dueOn === null ? null : parseYmdToUtcDate(dto.dueOn);
    }
    if (dto.priority !== undefined) {
      data.priority = priorityToDb[dto.priority];
    }
    if (dto.done !== undefined) {
      data.done = dto.done;
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
