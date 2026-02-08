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
          select: {
            id: true,
            complianceId: true,
            title: true,
            status: true,
            dueDate: true,
            entity: { select: { id: true, name: true } },
            law: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
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

    const reviewerFilter = userRole === 'admin' ? {} : { reviewerId: userId };
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const combinedFilter = { ...reviewerFilter, ...dateFilter };

    // Single batch: fetch all tasks + lookup tables + overdue list in parallel
    const [tasks, entities, departments, overdueTasks] = await Promise.all([
      this.prisma.complianceTask.findMany({
        where: combinedFilter,
        select: {
          entityId: true,
          departmentId: true,
          status: true,
          dueDate: true,
        },
      }),
      this.prisma.entity.findMany({ select: { id: true, name: true } }),
      this.prisma.department.findMany({ select: { id: true, name: true } }),
      this.prisma.complianceTask.findMany({
        where: {
          ...combinedFilter,
          status: 'PENDING',
          dueDate: { lt: today },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          entity: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          law: { select: { id: true, name: true } },
          owner: { select: { name: true, email: true } },
          reviewer: { select: { name: true, email: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
    ]);

    const entityMap = new Map(entities.map((e) => [e.id, e.name]));
    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

    // Aggregate entity stats in memory — replaces N×4 queries with 0 extra queries
    const entityAgg = new Map<string, { total: number; pending: number; completed: number; overdue: number }>();
    for (const task of tasks) {
      let s = entityAgg.get(task.entityId);
      if (!s) {
        s = { total: 0, pending: 0, completed: 0, overdue: 0 };
        entityAgg.set(task.entityId, s);
      }
      s.total++;
      if (task.status === 'PENDING') s.pending++;
      if (task.status === 'COMPLETED') s.completed++;
      if (task.status === 'PENDING' && task.dueDate && task.dueDate < today) s.overdue++;
    }

    const entityStatsWithNames = Array.from(entityAgg.entries()).map(([entityId, s]) => ({
      entityId,
      entityName: entityMap.get(entityId) || 'Unknown',
      totalTasks: s.total,
      pendingCount: s.pending,
      completedCount: s.completed,
      overdueCount: s.overdue,
    }));

    // Aggregate department stats in memory — replaces M×4 queries with 0 extra queries
    const deptAgg = new Map<string, { total: number; pending: number; completed: number; overdue: number }>();
    for (const task of tasks) {
      let s = deptAgg.get(task.departmentId);
      if (!s) {
        s = { total: 0, pending: 0, completed: 0, overdue: 0 };
        deptAgg.set(task.departmentId, s);
      }
      s.total++;
      if (task.status === 'PENDING') s.pending++;
      if (task.status === 'COMPLETED') s.completed++;
      if (task.status === 'PENDING' && task.dueDate && task.dueDate < today) s.overdue++;
    }

    const departmentStatsWithNames = Array.from(deptAgg.entries()).map(([departmentId, s]) => ({
      departmentId,
      departmentName: departmentMap.get(departmentId) || 'Unknown',
      totalTasks: s.total,
      pendingCount: s.pending,
      completedCount: s.completed,
      overdueCount: s.overdue,
    }));

    return {
      entityStats: entityStatsWithNames,
      departmentStats: departmentStatsWithNames,
      overdueTasks,
    };
  }

  async getAdminDashboard(startDate?: string, endDate?: string) {
    const today = new Date();
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Fetch all data in a single parallel batch — replaces ~160 queries with 4
    const [tasks, totalUsers, recentImports, users, departments] =
      await Promise.all([
        this.prisma.complianceTask.findMany({
          where: dateFilter,
          select: {
            status: true,
            dueDate: true,
            departmentId: true,
            ownerId: true,
            createdAt: true,
            completedAt: true,
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
        this.prisma.user.findMany({
          select: { id: true, name: true, email: true },
        }),
        this.prisma.department.findMany({
          select: { id: true, name: true },
        }),
      ]);

    // Aggregate top-level counts in memory
    let pendingTasks = 0;
    let completedTasks = 0;
    let skippedTasks = 0;
    let overdueTasksCount = 0;

    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
    const userMap = new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]));

    const deptAgg = new Map<string, { total: number; pending: number; completed: number; skipped: number; overdue: number }>();
    const ownerAgg = new Map<string, { total: number; pending: number; completed: number; skipped: number; overdue: number }>();

    for (const task of tasks) {
      const isPending = task.status === 'PENDING';
      const isCompleted = task.status === 'COMPLETED';
      const isSkipped = task.status === 'SKIPPED';
      const isOverdue = isPending && task.dueDate != null && task.dueDate < today;

      if (isPending) pendingTasks++;
      if (isCompleted) completedTasks++;
      if (isSkipped) skippedTasks++;
      if (isOverdue) overdueTasksCount++;

      // Department aggregation
      let ds = deptAgg.get(task.departmentId);
      if (!ds) {
        ds = { total: 0, pending: 0, completed: 0, skipped: 0, overdue: 0 };
        deptAgg.set(task.departmentId, ds);
      }
      ds.total++;
      if (isPending) ds.pending++;
      if (isCompleted) ds.completed++;
      if (isSkipped) ds.skipped++;
      if (isOverdue) ds.overdue++;

      // Owner aggregation
      let os = ownerAgg.get(task.ownerId);
      if (!os) {
        os = { total: 0, pending: 0, completed: 0, skipped: 0, overdue: 0 };
        ownerAgg.set(task.ownerId, os);
      }
      os.total++;
      if (isPending) os.pending++;
      if (isCompleted) os.completed++;
      if (isSkipped) os.skipped++;
      if (isOverdue) os.overdue++;
    }

    const departmentStatsWithNames = Array.from(deptAgg.entries()).map(([departmentId, s]) => ({
      departmentId,
      departmentName: departmentMap.get(departmentId) || 'Unknown',
      totalTasks: s.total,
      pendingCount: s.pending,
      completedCount: s.completed,
      skippedCount: s.skipped,
      overdueCount: s.overdue,
    }));

    const ownerStatsWithNames = Array.from(ownerAgg.entries()).map(([ownerId, s]) => ({
      ownerId,
      ownerName: userMap.get(ownerId)?.name || 'Unknown',
      ownerEmail: userMap.get(ownerId)?.email || '',
      totalTasks: s.total,
      pendingCount: s.pending,
      completedCount: s.completed,
      skippedCount: s.skipped,
      overdueCount: s.overdue,
    }));

    // Trends computed from already-fetched data — replaces 14 sequential queries with 0
    const trendData = this.computeTrends(tasks);

    return {
      totalTasks: tasks.length,
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

  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filter.createdAt.lt = end;
      }
    }

    return filter;
  }

  // Compute 7-day trends in memory from already-fetched task list
  private computeTrends(tasks: { createdAt: Date; completedAt: Date | null; status: string }[]) {
    const days = 7;
    const labels: string[] = [];
    const created: number[] = [];
    const completed: number[] = [];

    const buckets: { start: Date; end: Date }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      labels.push(
        date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      );
      buckets.push({ start: date, end: nextDate });
      created.push(0);
      completed.push(0);
    }

    for (const task of tasks) {
      for (let i = 0; i < buckets.length; i++) {
        const { start, end } = buckets[i];
        if (task.createdAt >= start && task.createdAt < end) {
          created[i]++;
        }
        if (task.completedAt && task.completedAt >= start && task.completedAt < end) {
          completed[i]++;
        }
      }
    }

    return { labels, created, completed };
  }

  async getSystemHealth() {
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
