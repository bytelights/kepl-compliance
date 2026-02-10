import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AuditService } from '../audit/audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Roles('admin', 'reviewer')
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  @Patch(':id/role')
  @Roles('admin')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = await this.usersService.updateRole(id, updateRoleDto);
    this.auditService.logUserRoleChange(currentUser.sub, id, '', updateRoleDto.role);
    return {
      success: true,
      data: user,
      message: 'User role updated successfully',
    };
  }
}
