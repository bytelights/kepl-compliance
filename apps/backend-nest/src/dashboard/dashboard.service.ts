import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
  ) {}

  async getTaskOwnerDashboard(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    // Build date filter
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [pendingCount, dueThisWeekCount, overdueCount, recentTasks] =
      await Promise.all([
        this.prisma.complianceTask.count({
          where: {
            ownerId: userId,
            status: 'PENDING',
            ...dateFilter,
          },
        }),
        this.prisma.complianceTask.count({
          where: {
            ownerId: userId,
            status: 'PENDING',
            dueDate: { gte: today, lte: next7Days },
            ...dateFilter,
          },
        }),
        this.prisma.complianceTask.count({
          where: {
            ownerId: userId,
            status: 'PENDING',
            dueDate: { lt: today },
            ...dateFilter,
          },
        }),
        this.prisma.complianceTask.findMany({
          where: {
            ownerId: userId,
            status: 'PENDING',
            ...dateFilter,
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

  async getReviewerDashboard(
    userId: string,
    userRole: string,
    startDate?: string,
    endDate?: string,
  ) {
    const today = new Date();

    // Determine filter: admin sees all, reviewer sees only their tasks
    const reviewerFilter = userRole === 'admin' ? {} : { reviewerId: userId };
    
    // Build date filter
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const combinedFilter = { ...reviewerFilter, ...dateFilter };

    // Entity-wise stats
    const entityStats = await this.prisma.complianceTask.groupBy({
      by: ['entityId'],
      where: combinedFilter,
      _count: { _all: true },
    });

    const entityStatsWithNames = await Promise.all(
      entityStats.map(async (stat) => {
        const [entity, pending, completed, overdue] = await Promise.all([
          this.prisma.entity.findUnique({ where: { id: stat.entityId } }),
          this.prisma.complianceTask.count({
            where: { ...combinedFilter, entityId: stat.entityId, status: 'PENDING' },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...combinedFilter,
              entityId: stat.entityId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...combinedFilter,
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
      where: combinedFilter,
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
              ...combinedFilter,
              departmentId: stat.departmentId,
              status: 'PENDING',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...combinedFilter,
              departmentId: stat.departmentId,
              status: 'COMPLETED',
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ...combinedFilter,
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
        ...combinedFilter,
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

  async getAdminDashboard(startDate?: string, endDate?: string) {
    const today = new Date();
    
    // Build date filter
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      skippedTasks,
      overdueTasksCount,
      totalUsers,
      recentImports,
    ] = await Promise.all([
      this.prisma.complianceTask.count({ where: dateFilter }),
      this.prisma.complianceTask.count({
        where: { status: 'PENDING', ...dateFilter },
      }),
      this.prisma.complianceTask.count({
        where: { status: 'COMPLETED', ...dateFilter },
      }),
      this.prisma.complianceTask.count({
        where: { status: 'SKIPPED', ...dateFilter },
      }),
      this.prisma.complianceTask.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: today },
          ...dateFilter,
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
      where: dateFilter,
      _count: { _all: true },
    });

    const departmentStatsWithNames = await Promise.all(
      departmentStats.map(async (stat) => {
        const [department, pending, completed, skipped, overdue] = await Promise.all([
          this.prisma.department.findUnique({
            where: { id: stat.departmentId },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'PENDING',
              ...dateFilter,
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'COMPLETED',
              ...dateFilter,
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'SKIPPED',
              ...dateFilter,
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              departmentId: stat.departmentId,
              status: 'PENDING',
              dueDate: { lt: today },
              ...dateFilter,
            },
          }),
        ]);

        return {
          departmentId: stat.departmentId,
          departmentName: department?.name || 'Unknown',
          totalTasks: stat._count._all,
          pendingCount: pending,
          completedCount: completed,
          skippedCount: skipped,
          overdueCount: overdue,
        };
      }),
    );

    // Owner-wise stats (assigned persons)
    const ownerStats = await this.prisma.complianceTask.groupBy({
      by: ['ownerId'],
      where: dateFilter,
      _count: { _all: true },
    });

    const ownerStatsWithNames = await Promise.all(
      ownerStats.map(async (stat) => {
        const [owner, pending, completed, skipped, overdue] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: stat.ownerId },
            select: { name: true, email: true },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'PENDING',
              ...dateFilter,
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'COMPLETED',
              ...dateFilter,
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'SKIPPED',
              ...dateFilter,
            },
          }),
          this.prisma.complianceTask.count({
            where: {
              ownerId: stat.ownerId,
              status: 'PENDING',
              dueDate: { lt: today },
              ...dateFilter,
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
          skippedCount: skipped,
          overdueCount: overdue,
        };
      }),
    );

    // Task completion trends (last 7 days)
    const trendData = await this.getTaskTrends(dateFilter);

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      skippedTasks,
      overdueTasks: overdueTasksCount,
      totalUsers,
      recentImports,
      departmentStats: departmentStatsWithNames,
      ownerStats: ownerStatsWithNames,
      trendData,
    };
  }

  // Helper method to build date filter
  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to include the entire end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filter.createdAt.lt = end;
      }
    }

    return filter;
  }

  // Get task completion trends for the last 7 days
  private async getTaskTrends(dateFilter: any) {
    const days = 7;
    const labels: string[] = [];
    const completed: number[] = [];
    const created: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      // Format label
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

      // Count tasks created on this day
      const createdCount = await this.prisma.complianceTask.count({
        where: {
          ...dateFilter,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      // Count tasks completed on this day
      const completedCount = await this.prisma.complianceTask.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      created.push(createdCount);
      completed.push(completedCount);
    }

    return { labels, created, completed };
  }

  // System health check (for admin settings page)
  async getSystemHealth() {
    // Check Database
    let dbStatus = 'OK';
    let dbMessage = 'Database connection is healthy';
    let dbResponseTime = 0;
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - startTime;
    } catch {
      dbStatus = 'ERROR';
      dbMessage = 'Database connection failed';
    }

    // Check SharePoint configuration
    const sharePointConfig = await this.integrationsService.getSharePointConfig();
    const sharePointConfigured = !!(
      sharePointConfig.siteId &&
      sharePointConfig.driveId &&
      sharePointConfig.siteId.trim() !== '' &&
      sharePointConfig.driveId.trim() !== ''
    );
    const sharePointStatus = sharePointConfigured ? 'OK' : 'NOT_CONFIGURED';
    const sharePointMessage = sharePointConfigured
      ? 'SharePoint integration is configured'
      : 'SharePoint integration is not configured';

    // Check Teams configuration
    const teamsConfig = await this.integrationsService.getTeamsConfig();
    const teamsConfigured = !!(
      teamsConfig.webhookUrl &&
      teamsConfig.webhookUrl.trim() !== ''
    );
    const teamsStatus = teamsConfigured ? 'OK' : 'NOT_CONFIGURED';
    const teamsMessage = teamsConfigured
      ? 'Microsoft Teams integration is configured'
      : 'Microsoft Teams webhook is not configured';

    return {
      database: {
        status: dbStatus,
        message: dbMessage,
        responseTime: dbResponseTime,
      },
      sharepoint: {
        status: sharePointStatus,
        message: sharePointMessage,
        configured: sharePointConfigured,
      },
      teams: {
        status: teamsStatus,
        message: teamsMessage,
        configured: teamsConfigured,
      },
    };
  }
}
