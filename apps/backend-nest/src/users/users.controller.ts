import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  async findAll(@CurrentUser() user: JwtPayload) {
    const users = await this.usersService.findAll(user.workspaceId);
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
  ) {
    const user = await this.usersService.updateRole(id, updateRoleDto);
    return {
      success: true,
      data: user,
      message: 'User role updated successfully',
    };
  }
}
