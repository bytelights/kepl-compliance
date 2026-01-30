import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { SharePointService } from '../evidence/sharepoint.service';
import { TeamsService } from '../reports/teams.service';
import { ReportsService } from '../reports/reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('integrations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly sharePointService: SharePointService,
    private readonly teamsService: TeamsService,
    private readonly reportsService: ReportsService,
  ) {}

  // ========== SHAREPOINT ==========
  @Get('sharepoint')
  async getSharePointConfig(@CurrentUser() user: JwtPayload) {
    const data = await this.integrationsService.getSharePointConfig(
      user.workspaceId,
    );
    return { success: true, data };
  }

  @Put('sharepoint')
  async updateSharePointConfig(
    @CurrentUser() user: JwtPayload,
    @Body()
    config: { siteId: string; driveId: string; baseFolderName?: string },
  ) {
    await this.integrationsService.updateSharePointConfig(
      user.workspaceId,
      config,
    );
    return { success: true, message: 'SharePoint configuration updated' };
  }

  @Post('sharepoint/test')
  async testSharePointConnection() {
    const result = await this.sharePointService.testConnection();
    return { success: result.success, message: result.message };
  }

  // ========== TEAMS ==========
  @Get('teams')
  async getTeamsConfig(@CurrentUser() user: JwtPayload) {
    const data = await this.integrationsService.getTeamsConfig(
      user.workspaceId,
    );
    return { success: true, data };
  }

  @Put('teams')
  async updateTeamsConfig(
    @CurrentUser() user: JwtPayload,
    @Body()
    config: {
      webhookUrl: string;
      weeklyReportDay?: number;
      weeklyReportTime?: string;
      timezone?: string;
    },
  ) {
    await this.integrationsService.updateTeamsConfig(user.workspaceId, config);
    return { success: true, message: 'Teams configuration updated' };
  }

  @Post('teams/test')
  async testTeamsWebhook(@CurrentUser() user: JwtPayload) {
    const config = await this.integrationsService.getTeamsConfig(
      user.workspaceId,
    );

    if (!config.webhookUrl) {
      return { success: false, message: 'Teams webhook URL not configured' };
    }

    const result = await this.teamsService.testConnection(config.webhookUrl);
    return { success: result.success, message: result.message };
  }

  @Post('teams/send-report-now')
  async sendReportNow(@CurrentUser() user: JwtPayload) {
    await this.reportsService.sendReportNow(user.workspaceId);
    return { success: true, message: 'Report generation triggered' };
  }
}
