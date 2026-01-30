import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: data.workspaceId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes || {},
          requestId: data.requestId,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  async findAll(
    workspaceId: string,
    options: {
      page?: number;
      limit?: number;
      userId?: string;
      action?: string;
      entityType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ) {
    const { page = 1, limit = 50, ...filters } = options;
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action)
      where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entityType) where.entityType = filters.entityType;

    if (filters.dateFrom || filters.dateTo) {
      where.timestamp = {};
      if (filters.dateFrom) where.timestamp.gte = filters.dateFrom;
      if (filters.dateTo) where.timestamp.lte = filters.dateTo;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper methods for common audit actions
  async logUserRoleChange(
    workspaceId: string,
    performedBy: string,
    userId: string,
    oldRole: string,
    newRole: string,
  ) {
    await this.log({
      workspaceId,
      userId: performedBy,
      action: 'USER_ROLE_CHANGED',
      entityType: 'USER',
      entityId: userId,
      changes: { oldRole, newRole },
    });
  }

  async logTaskCreated(
    workspaceId: string,
    userId: string,
    taskId: string,
    taskData: any,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: taskId,
      changes: { data: taskData },
    });
  }

  async logTaskUpdated(
    workspaceId: string,
    userId: string,
    taskId: string,
    changes: any,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      changes,
    });
  }

  async logTaskCompleted(
    workspaceId: string,
    userId: string,
    taskId: string,
    comment: string,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: 'TASK_COMPLETED',
      entityType: 'TASK',
      entityId: taskId,
      changes: { comment },
    });
  }

  async logTaskSkipped(
    workspaceId: string,
    userId: string,
    taskId: string,
    remarks: string,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: 'TASK_SKIPPED',
      entityType: 'TASK',
      entityId: taskId,
      changes: { remarks },
    });
  }

  async logEvidenceUploaded(
    workspaceId: string,
    userId: string,
    taskId: string,
    fileName: string,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: 'EVIDENCE_UPLOADED',
      entityType: 'EVIDENCE',
      entityId: taskId,
      changes: { fileName },
    });
  }

  async logCsvImport(
    workspaceId: string,
    userId: string,
    jobId: string,
    mode: string,
    result: any,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: `CSV_IMPORT_${mode.toUpperCase()}`,
      entityType: 'CSV_IMPORT',
      entityId: jobId,
      changes: result,
    });
  }

  async logMasterDataChange(
    workspaceId: string,
    userId: string,
    action: string,
    type: string,
    itemId: string,
    changes?: any,
  ) {
    await this.log({
      workspaceId,
      userId,
      action: `MASTER_DATA_${action}`,
      entityType: type.toUpperCase(),
      entityId: itemId,
      changes,
    });
  }
}
