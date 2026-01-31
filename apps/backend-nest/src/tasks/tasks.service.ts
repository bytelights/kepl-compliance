import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskListQueryDto } from './dto/task-list-query.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { SkipTaskDto } from './dto/skip-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: TaskListQueryDto,
    userRole: string,
    userId: string,
  ) {
    const { page = 1, limit = 50, search, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(filters.lawId && { lawId: filters.lawId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.ownerId && { ownerId: filters.ownerId }),
      ...(filters.reviewerId && { reviewerId: filters.reviewerId }),
      ...(filters.impact && { impact: filters.impact }),
      ...(filters.frequency && { frequency: filters.frequency }),
      ...(filters.complianceId && {
        complianceId: { contains: filters.complianceId, mode: 'insensitive' },
      }),
    };

    // Date range filter
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom)
        where.dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { complianceId: { contains: search, mode: 'insensitive' } },
        { entity: { name: { contains: search, mode: 'insensitive' } } },
        { law: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // RBAC: task_owner sees only their tasks
    if (userRole === 'task_owner') {
      where.ownerId = userId;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.complianceTask.findMany({
        where,
        skip,
        take: limit,
        include: {
          entity: true,
          department: true,
          law: true,
          complianceMaster: true,
          owner: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          _count: { select: { evidenceFiles: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.complianceTask.count({ where }),
    ]);

    // Add isOverdue flag
    const today = new Date();
    const tasksWithOverdue = tasks.map((task) => ({
      ...task,
      evidenceCount: task._count.evidenceFiles,
      isOverdue:
        task.dueDate && task.dueDate < today && task.status === 'PENDING',
    }));

    return {
      items: tasksWithOverdue,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, userRole: string, userId: string) {
    const task = await this.prisma.complianceTask.findUnique({
      where: { id },
      include: {
        entity: true,
        department: true,
        law: true,
        complianceMaster: true,
        owner: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        evidenceFiles: {
          select: {
            id: true,
            name: true,
            webUrl: true,
            sizeBytes: true,
            mimeType: true,
            uploadedAt: true,
            uploadedBy: true,
          },
        },
        taskExecutions: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // RBAC: task_owner can only see their own tasks
    if (userRole === 'task_owner' && task.ownerId !== userId) {
      throw new ForbiddenException('You can only view your own tasks');
    }

    return task;
  }

  async create(createDto: CreateTaskDto) {
    // Check for duplicate
    const existing = await this.prisma.complianceTask.findUnique({
      where: {
        complianceId_entityId: {
          complianceId: createDto.complianceId,
          entityId: createDto.entityId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Task with this compliance ID and entity already exists',
      );
    }

    return this.prisma.complianceTask.create({
      data: createDto,
      include: {
        entity: true,
        department: true,
        law: true,
        owner: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(id: string, updateDto: UpdateTaskDto) {
    await this.findById(id, 'admin', ''); // Check exists

    return this.prisma.complianceTask.update({
      where: { id },
      data: updateDto,
      include: {
        entity: true,
        department: true,
        law: true,
        owner: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id, 'admin', '');
    await this.prisma.complianceTask.delete({ where: { id } });
  }

  async completeTask(
    taskId: string,
    userId: string,
    completeDto: CompleteTaskDto,
  ) {
    const task = await this.findById(taskId, 'task_owner', userId);

    if (task.ownerId !== userId) {
      throw new ForbiddenException('You can only complete your own tasks');
    }

    if (task.status !== 'PENDING') {
      throw new BadRequestException('Task is already completed or skipped');
    }

    // Check evidence exists
    const evidenceCount = await this.prisma.evidenceFile.count({
      where: { taskId },
    });

    if (evidenceCount === 0) {
      throw new BadRequestException(
        'At least one evidence file is required to complete the task',
      );
    }

    // Transaction: create execution record + update status
    return this.prisma.$transaction(async (tx) => {
      await tx.taskExecution.create({
        data: {
          taskId,
          userId,
          action: 'COMPLETE',
          comment: completeDto.comment,
        },
      });

      return tx.complianceTask.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' },
      });
    });
  }

  async skipTask(taskId: string, userId: string, skipDto: SkipTaskDto) {
    const task = await this.findById(taskId, 'task_owner', userId);

    if (task.ownerId !== userId) {
      throw new ForbiddenException('You can only skip your own tasks');
    }

    if (task.status !== 'PENDING') {
      throw new BadRequestException('Task is already completed or skipped');
    }

    // Transaction: create execution record + update status
    return this.prisma.$transaction(async (tx) => {
      await tx.taskExecution.create({
        data: {
          taskId,
          userId,
          action: 'SKIP',
          remarks: skipDto.remarks,
        },
      });

      return tx.complianceTask.update({
        where: { id: taskId },
        data: { status: 'SKIPPED' },
      });
    });
  }
}
