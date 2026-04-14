import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTodoDto } from './dto/create-todo.dto';
import { ListTodosQueryDto } from './dto/list-todos.query';
import { PatchTodoDto } from './dto/patch-todo.dto';
import { TodosService } from './todos.service';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListTodosQueryDto) {
    return this.todos.list(user.userId, query);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTodoDto) {
    return this.todos.create(user.userId, dto);
  }

  @Patch(':id')
  patch(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: PatchTodoDto,
  ) {
    return this.todos.patch(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.todos.remove(user.userId, id);
  }
}
