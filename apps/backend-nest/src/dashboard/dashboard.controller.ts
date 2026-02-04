import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('task-owner')
  @Roles('task_owner')
  async getTaskOwnerDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.dashboardService.getTaskOwnerDashboard(
      user.sub,
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  @Get('reviewer')
  @Roles('reviewer', 'admin')
  async getReviewerDashboard(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.dashboardService.getReviewerDashboard(
      user.sub,
      user.role,
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  @Get('admin')
  @Roles('admin')
  async getAdminDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.dashboardService.getAdminDashboard(
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  @Get('system-health')
  @Roles('admin')
  async getSystemHealth() {
    const data = await this.dashboardService.getSystemHealth();
    return { success: true, data };
  }
}
