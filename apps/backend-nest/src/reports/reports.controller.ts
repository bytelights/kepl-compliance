import { Controller, Post, Get, Body, UseGuards, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { TeamsService } from './teams.service';
import { ExportService } from './export.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private teamsService: TeamsService,
    private exportService: ExportService,
  ) {}

  /**
   * Manually trigger weekly report
   * Admin/Reviewer only
   */
  @Post('weekly/trigger')
  @Roles('ADMIN', 'REVIEWER')
  async triggerWeeklyReport() {
    await this.reportsService.sendReportNow();
    return {
      success: true,
      message: 'Weekly report triggered successfully',
    };
  }

  /**
   * Test Teams webhook connection
   * Admin only
   */
  @Post('teams/test')
  @Roles('ADMIN')
  async testTeamsWebhook(@Body() body: { webhookUrl: string }) {
    const result = await this.teamsService.testConnection(body.webhookUrl);
    return result;
  }

  /**
   * Get report run history
   * Admin/Reviewer only
   */
  @Get('history')
  @Roles('ADMIN', 'REVIEWER')
  async getReportHistory() {
    // This would query the reportRun table
    return {
      success: true,
      message: 'Report history endpoint - to be implemented',
    };
  }

  /**
   * Export compliance summary report as CSV
   * Admin/Reviewer only
   */
  @Get('export/compliance-summary')
  @Roles('ADMIN', 'REVIEWER')
  async exportComplianceSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res: Response = undefined as any,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const data = await this.exportService.generateComplianceSummary(start, end);
    const csv = this.exportService.convertToCSV(data);

    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename=compliance-summary-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res!.send(csv);
  }

  /**
   * Export department-wise report as CSV
   * Admin/Reviewer only
   */
  @Get('export/department-report')
  @Roles('ADMIN', 'REVIEWER')
  async exportDepartmentReport(@Res() res: Response = undefined as any) {
    const data = await this.exportService.generateDepartmentReport();
    const csv = this.exportService.convertToCSV(data);

    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename=department-report-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res!.send(csv);
  }

  /**
   * Export overdue tasks report as CSV
   * Admin/Reviewer only
   */
  @Get('export/overdue-tasks')
  @Roles('ADMIN', 'REVIEWER')
  async exportOverdueTasks(@Res() res: Response = undefined as any) {
    const data = await this.exportService.generateOverdueReport();
    const csv = this.exportService.convertToCSV(data);

    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename=overdue-tasks-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res!.send(csv);
  }
}
