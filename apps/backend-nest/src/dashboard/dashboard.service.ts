import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTaskOwnerDashboard(userId: string) {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const [pendingCount, dueThisWeekCount, overdueCount, recentTasks] =
      await Promise.all([
        this.prisma.complianceTask.count({
          where: {
            ownerId: userId,
            status: 'PENDING',
          },
        }),
        this.prisma.complianceTask.count({
          where: {
            ownerId: userId,
            status: 'PENDING',
            dueDate: { gte: today, lte: next7Days },
          },
        }),
        this.prisma.complianceTask.count({
          where: {
            ownerId: userId,
            status: 'PENDING',
            dueDate: { lt: today },
          },
        }),
        this.prisma.complianceTask.findMany({
          where: {
            ownerId: userId,
            status: 'PENDING',
          },
          include: {
            entity: true,
            law: true,
            department: true,
            _count: { select: { evidenceFiles: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
      ]);

    return {
      pendingCount,
      dueThisWeekCount,
      overdueCount,
      recentTasks: recentTasks.map((task) => ({
        ...task,
        evidenceCount: task._count.evidenceFiles,
        isOverdue: task.dueDate && task.dueDate < today,
      })),
    };
  }

  async getReviewerDashboard(userId: string, userRole: string) {
    const today = new Date();

    // Determine filter: admin sees all, reviewer sees only their tasks
    const reviewerFilter = userRole === 'admin' ? {} : { reviewerId: userId };

    // Entity-wise stats
    const entityStats = await this.prisma.complianceTask.groupBy({
      by: ['entityId'],
      where: reviewerFilter,
      _count: { _all: true },
    });

    const entityStatsWithNames = await Promise.all(
      entityStats.map(async (stat) => {
        const [entity, pending, completed, overdue] = await Promise.all([
          this.prisma.entity.findUnique({ where: { id: stat.entityId } }),
          this.prisma.complianceTask.count({
            where: { ...reviewerFilter, entityId: stat.entityId, status: 'PENDING' },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...reviewerFilter,
              entityId: stat.entityId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...reviewerFilter,
              entityId: stat.entityId,
              status: 'PENDING',
              dueDate: { lt: today },
            },
          }),
        ]);

        return {
          entityId: stat.entityId,
          entityName: entity?.name || 'Unknown',
          totalTasks: stat._count._all,
          pendingCount: pending,
          completedCount: completed,
          overdueCount: overdue,
        };
      }),
    );

    // Department-wise stats
    const departmentStats = await this.prisma.complianceTask.groupBy({
      by: ['departmentId'],
      where: reviewerFilter,
      _count: { _all: true },
    });

    const departmentStatsWithNames = await Promise.all(
      departmentStats.map(async (stat) => {
        const [department, pending, completed, overdue] = await Promise.all([
          this.prisma.department.findUnique({
            where: { id: stat.departmentId },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...reviewerFilter,
              departmentId: stat.departmentId,
              status: 'PENDING',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...reviewerFilter,
              departmentId: stat.departmentId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...reviewerFilter,
              departmentId: stat.departmentId,
              status: 'PENDING',
              dueDate: { lt: today },
            },
          }),
        ]);

        return {
          departmentId: stat.departmentId,
          departmentName: department?.name || 'Unknown',
          totalTasks: stat._count._all,
          pendingCount: pending,
          completedCount: completed,
          overdueCount: overdue,
        };
      }),
    );

    // Overdue tasks
    const overdueTasks = await this.prisma.complianceTask.findMany({
      where: {
        ...reviewerFilter,
        status: 'PENDING',
        dueDate: { lt: today },
      },
      include: {
        entity: true,
        department: true,
        law: true,
        owner: { select: { name: true, email: true } },
        reviewer: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    return {
      entityStats: entityStatsWithNames,
      departmentStats: departmentStatsWithNames,
      overdueTasks,
    };
  }

  async getAdminDashboard() {
    const today = new Date();

    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasksCount,
      totalUsers,
      recentImports,
    ] = await Promise.all([
      this.prisma.complianceTask.count(),
      this.prisma.complianceTask.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.complianceTask.count({
        where: { status: 'COMPLETED' },
      }),
      this.prisma.complianceTask.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: today },
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.csvImportJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          uploader: { select: { name: true, email: true } },
        },
      }),
    ]);

    // Department-wise stats
    const departmentStats = await this.prisma.complianceTask.groupBy({
      by: ['departmentId'],
      _count: { _all: true },
    });

    const departmentStatsWithNames = await Promise.all(
      departmentStats.map(async (stat) => {
        const [department, pending, completed, overdue] = await Promise.all([
          this.prisma.department.findUnique({
            where: { id: stat.departmentId },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'PENDING',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'PENDING',
              dueDate: { lt: today },
            },
          }),
        ]);

        return {
          departmentId: stat.departmentId,
          departmentName: department?.name || 'Unknown',
          totalTasks: stat._count._all,
          pendingCount: pending,
          completedCount: completed,
          overdueCount: overdue,
        };
      }),
    );

    // Owner-wise stats (assigned persons)
    const ownerStats = await this.prisma.complianceTask.groupBy({
      by: ['ownerId'],
      _count: { _all: true },
    });

    const ownerStatsWithNames = await Promise.all(
      ownerStats.map(async (stat) => {
        const [owner, pending, completed, overdue] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: stat.ownerId },
            select: { name: true, email: true },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'PENDING',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'PENDING',
              dueDate: { lt: today },
            },
          }),
        ]);

        return {
          ownerId: stat.ownerId,
          ownerName: owner?.name || 'Unknown',
          ownerEmail: owner?.email || '',
          totalTasks: stat._count._all,
          pendingCount: pending,
          completedCount: completed,
          overdueCount: overdue,
        };
      }),
    );

    // System health (basic checks)
    let dbConnected = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbConnected = false;
    }

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks: overdueTasksCount,
      totalUsers,
      recentImports,
      departmentStats: departmentStatsWithNames,
      ownerStats: ownerStatsWithNames,
      systemHealth: {
        dbConnected,
        sharePointConnected: true, // Would need actual check
        teamsConnected: true, // Would need actual check
      },
    };
  }
}
