import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AdminPageQueryDto } from './dto/admin-page.query';
import {
  CreateAdminDiaryTemplateDto,
  PatchAdminDiaryTemplateDto,
} from './dto/diary-template-admin.dto';

@Controller('admin/diary-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDiaryTemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: AdminPageQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 15));
    const [totalCount, rows] = await Promise.all([
      this.prisma.diaryTemplate.count(),
      this.prisma.diaryTemplate.findMany({
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        schema: t.schema,
        active: t.active,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      page,
      pageSize,
      totalCount,
    };
  }

  @Post()
  async create(@Body() dto: CreateAdminDiaryTemplateDto) {
    const row = await this.prisma.diaryTemplate.create({
      data: {
        name: dto.name,
        schema: dto.schema as Prisma.InputJsonValue,
        active: dto.active ?? true,
      },
    });
    return {
      id: row.id,
      name: row.name,
      schema: row.schema,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchAdminDiaryTemplateDto) {
    const existing = await this.prisma.diaryTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '일기 템플릿을 찾을 수 없습니다.',
      });
    }
    const row = await this.prisma.diaryTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.schema !== undefined
          ? { schema: dto.schema as Prisma.InputJsonValue }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    return {
      id: row.id,
      name: row.name,
      schema: row.schema,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    const row = await this.prisma.diaryTemplate.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '일기 템플릿을 찾을 수 없습니다.',
      });
    }
    await this.prisma.diaryTemplate.delete({ where: { id } });
  }
}
