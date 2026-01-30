import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('task-owner')
  @Roles('task_owner')
  async getTaskOwnerDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboardService.getTaskOwnerDashboard(
      user.workspaceId,
      user.sub,
    );
    return { success: true, data };
  }

  @Get('reviewer')
  @Roles('reviewer', 'admin')
  async getReviewerDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboardService.getReviewerDashboard(
      user.workspaceId,
    );
    return { success: true, data };
  }

  @Get('admin')
  @Roles('admin')
  async getAdminDashboard(@CurrentUser() user: JwtPayload) {
    const data = await this.dashboardService.getAdminDashboard(
      user.workspaceId,
    );
    return { success: true, data };
  }
}
