import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskListQueryDto } from './dto/task-list-query.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { SkipTaskDto } from './dto/skip-task.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: TaskListQueryDto,
  ) {
    const data = await this.tasksService.findAll(
      user.workspaceId,
      query,
      user.role,
      user.sub,
    );
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.tasksService.findById(
      id,
      user.workspaceId,
      user.role,
      user.sub,
    );
    return { success: true, data };
  }

  @Post()
  @Roles('admin', 'reviewer')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createDto: CreateTaskDto,
  ) {
    const data = await this.tasksService.create(user.workspaceId, createDto);
    return { success: true, data, message: 'Task created successfully' };
  }

  @Patch(':id')
  @Roles('admin', 'reviewer')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateDto: UpdateTaskDto,
  ) {
    const data = await this.tasksService.update(
      id,
      user.workspaceId,
      updateDto,
    );
    return { success: true, data, message: 'Task updated successfully' };
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.tasksService.delete(id, user.workspaceId);
    return { success: true, message: 'Task deleted successfully' };
  }

  @Post(':id/execute/complete')
  @Roles('task_owner')
  async completeTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() completeDto: CompleteTaskDto,
  ) {
    const data = await this.tasksService.completeTask(
      id,
      user.workspaceId,
      user.sub,
      completeDto,
    );
    return { success: true, data, message: 'Task completed successfully' };
  }

  @Post(':id/execute/skip')
  @Roles('task_owner')
  async skipTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() skipDto: SkipTaskDto,
  ) {
    const data = await this.tasksService.skipTask(
      id,
      user.workspaceId,
      user.sub,
      skipDto,
    );
    return { success: true, data, message: 'Task skipped successfully' };
  }
}
