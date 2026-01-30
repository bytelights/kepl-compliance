import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from './teams.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private teamsService: TeamsService,
  ) {}

  // Run every Monday at 9 AM (configurable via configs table)
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-compliance-report',
  })
  async sendWeeklyReport() {
    console.log('Running weekly compliance report...');

    // Get all workspaces
    const workspaces = await this.prisma.workspace.findMany();

    for (const workspace of workspaces) {
      await this.generateAndSendReport(workspace.id);
    }
  }

  async generateAndSendReport(workspaceId: string): Promise<void> {
    try {
      // Get Teams webhook URL from configs
      const webhookConfig = await this.prisma.config.findUnique({
        where: {
          workspaceId_keyName: {
            workspaceId,
            keyName: 'teams_webhook_url',
          },
        },
      });

      if (!webhookConfig || !webhookConfig.active) {
        console.log(`No active Teams webhook for workspace ${workspaceId}`);
        return;
      }

      const webhookUrl = webhookConfig.value;

      // Calculate date ranges
      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);

      const periodStart = new Date();
      periodStart.setDate(today.getDate() - 7);

      // Check for duplicate report this period
      const existingReport = await this.prisma.reportRun.findFirst({
        where: {
          workspaceId,
          reportType: 'WEEKLY_TEAMS',
          periodStart: { gte: periodStart },
          success: true,
        },
      });

      if (existingReport) {
        console.log(`Report already sent for this period`);
        return;
      }

      // Get task statistics
      const [pending, dueNext7Days, overdue] = await Promise.all([
        this.prisma.complianceTask.count({
          where: { workspaceId, status: 'PENDING' },
        }),
        this.prisma.complianceTask.count({
          where: {
            workspaceId,
            status: 'PENDING',
            dueDate: { gte: today, lte: next7Days },
          },
        }),
        this.prisma.complianceTask.count({
          where: {
            workspaceId,
            status: 'PENDING',
            dueDate: { lt: today },
          },
        }),
      ]);

      // Get top tasks
      const tasks = await this.prisma.complianceTask.findMany({
        where: {
          workspaceId,
          status: 'PENDING',
          OR: [
            { dueDate: { lt: today } }, // Overdue
            { dueDate: { gte: today, lte: next7Days } }, // Due soon
          ],
        },
        include: {
          entity: true,
          owner: { select: { name: true } },
          reviewer: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      });

      const taskData = tasks.map((task) => ({
        complianceId: task.complianceId,
        title: task.title,
        entity: task.entity.name,
        dueDate: task.dueDate?.toLocaleDateString() || 'N/A',
        status: task.status,
        impact: task.impact || 'N/A',
        owner: task.owner.name,
        reviewer: task.reviewer.name,
      }));

      // Create Adaptive Card
      const card = this.teamsService.createWeeklyReportCard(
        { pending, dueNext7Days, overdue },
        taskData,
      );

      // Send to Teams
      await this.teamsService.sendAdaptiveCard(webhookUrl, card);

      // Log successful report
      await this.prisma.reportRun.create({
        data: {
          workspaceId,
          reportType: 'WEEKLY_TEAMS',
          success: true,
          periodStart,
          periodEnd: today,
        },
      });

      console.log(
        `Weekly report sent successfully for workspace ${workspaceId}`,
      );
    } catch (error: any) {
      console.error('Failed to send weekly report:', error);

      // Log failed report
      await this.prisma.reportRun.create({
        data: {
          workspaceId,
          reportType: 'WEEKLY_TEAMS',
          success: false,
          errorMsg: error.message,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
      });
    }
  }

  // Manual trigger for testing
  async sendReportNow(workspaceId: string): Promise<void> {
    await this.generateAndSendReport(workspaceId);
  }
}
