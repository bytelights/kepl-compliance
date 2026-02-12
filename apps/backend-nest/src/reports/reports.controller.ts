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
  @Roles('admin', 'reviewer')
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
  @Roles('admin')
  async testTeamsWebhook(@Body() body: { webhookUrl: string }) {
    const result = await this.teamsService.testConnection(body.webhookUrl);
    return result;
  }

  /**
   * Send test report with sample data to preview format
   * Admin only
   */
  @Post('teams/test-report')
  @Roles('admin')
  async testTeamsReport(@Body() body: { webhookUrl: string }) {
    const sampleSummary = { pending: 12, dueNext7Days: 5, overdue: 3 };
    const sampleTasks = [
      { complianceId: 'COMP-001', title: 'Annual GST Return Filing', entity: 'ABC Pvt Ltd', dueDate: '15 Feb 2026', status: 'PENDING', impact: 'HIGH', owner: 'Rahul Mehta', reviewer: 'Priya Sharma' },
      { complianceId: 'COMP-002', title: 'TDS Quarterly Return', entity: 'XYZ Corp', dueDate: '10 Feb 2026', status: 'PENDING', impact: 'CRITICAL', owner: 'Ankit Verma', reviewer: 'Priya Sharma' },
      { complianceId: 'COMP-003', title: 'FEMA Compliance Report', entity: 'ABC Pvt Ltd', dueDate: '20 Feb 2026', status: 'PENDING', impact: 'MEDIUM', owner: 'Sneha Patil', reviewer: 'Vikram Singh' },
      { complianceId: 'COMP-004', title: 'ROC Annual Filing', entity: 'DEF Industries', dueDate: '28 Feb 2026', status: 'PENDING', impact: 'HIGH', owner: 'Rahul Mehta', reviewer: 'Vikram Singh' },
      { complianceId: 'COMP-005', title: 'PF Monthly Return', entity: 'XYZ Corp', dueDate: '12 Feb 2026', status: 'PENDING', impact: 'LOW', owner: 'Ankit Verma', reviewer: 'Priya Sharma' },
    ];

    try {
      await this.teamsService.sendWeeklyReport(body.webhookUrl, sampleSummary, sampleTasks);
      return { success: true, message: 'Test report sent successfully' };
    } catch (error: any) {
      return { success: false, message: `Failed to send test report: ${error.message}` };
    }
  }

  /**
   * Get report run history
   * Admin/Reviewer only
   */
  @Get('history')
  @Roles('admin', 'reviewer')
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
  @Roles('admin', 'reviewer')
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
  @Roles('admin', 'reviewer')
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
  @Roles('admin', 'reviewer')
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
