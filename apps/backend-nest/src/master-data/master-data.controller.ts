import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MasterDataService } from './master-data.service';
import { CreateMasterDataDto } from './dto/create-master-data.dto';
import { UpdateMasterDataDto } from './dto/update-master-data.dto';
import { AuditService } from '../audit/audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('master-data')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MasterDataController {
  constructor(
    private readonly masterDataService: MasterDataService,
    private readonly auditService: AuditService,
  ) {}

  // ========== ENTITIES ==========
  @Get('entities')
  async getAllEntities() {
    const data = await this.masterDataService.findAll('entities');
    return { success: true, data };
  }

  @Post('entities')
  @Roles('admin')
  async createEntity(@Body() createDto: CreateMasterDataDto, @CurrentUser() user: JwtPayload) {
    const data = await this.masterDataService.create('entities', createDto);
    this.auditService.logMasterDataChange(user.sub, 'CREATED', 'ENTITY', data.id, createDto);
    return { success: true, data, message: 'Entity created successfully' };
  }

  @Patch('entities/:id')
  @Roles('admin')
  async updateEntity(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.masterDataService.update('entities', id, updateDto);
    this.auditService.logMasterDataChange(user.sub, 'UPDATED', 'ENTITY', id, updateDto);
    return { success: true, data, message: 'Entity updated successfully' };
  }

  @Delete('entities/:id')
  @Roles('admin')
  async deleteEntity(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.masterDataService.delete('entities', id);
    this.auditService.logMasterDataChange(user.sub, 'DELETED', 'ENTITY', id);
    return { success: true, message: 'Entity deleted successfully' };
  }

  // ========== DEPARTMENTS ==========
  @Get('departments')
  async getAllDepartments() {
    const data = await this.masterDataService.findAll('departments');
    return { success: true, data };
  }

  @Post('departments')
  @Roles('admin')
  async createDepartment(@Body() createDto: CreateMasterDataDto, @CurrentUser() user: JwtPayload) {
    const data = await this.masterDataService.create('departments', createDto);
    this.auditService.logMasterDataChange(user.sub, 'CREATED', 'DEPARTMENT', data.id, createDto);
    return { success: true, data, message: 'Department created successfully' };
  }

  @Patch('departments/:id')
  @Roles('admin')
  async updateDepartment(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.masterDataService.update(
      'departments',
      id,
      updateDto,
    );
    this.auditService.logMasterDataChange(user.sub, 'UPDATED', 'DEPARTMENT', id, updateDto);
    return { success: true, data, message: 'Department updated successfully' };
  }

  @Delete('departments/:id')
  @Roles('admin')
  async deleteDepartment(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.masterDataService.delete('departments', id);
    this.auditService.logMasterDataChange(user.sub, 'DELETED', 'DEPARTMENT', id);
    return { success: true, message: 'Department deleted successfully' };
  }

  // ========== LAWS ==========
  @Get('laws')
  async getAllLaws() {
    const data = await this.masterDataService.findAll('laws');
    return { success: true, data };
  }

  @Post('laws')
  @Roles('admin')
  async createLaw(@Body() createDto: CreateMasterDataDto, @CurrentUser() user: JwtPayload) {
    const data = await this.masterDataService.create('laws', createDto);
    this.auditService.logMasterDataChange(user.sub, 'CREATED', 'LAW', data.id, createDto);
    return { success: true, data, message: 'Law created successfully' };
  }

  @Patch('laws/:id')
  @Roles('admin')
  async updateLaw(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.masterDataService.update('laws', id, updateDto);
    this.auditService.logMasterDataChange(user.sub, 'UPDATED', 'LAW', id, updateDto);
    return { success: true, data, message: 'Law updated successfully' };
  }

  @Delete('laws/:id')
  @Roles('admin')
  async deleteLaw(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.masterDataService.delete('laws', id);
    this.auditService.logMasterDataChange(user.sub, 'DELETED', 'LAW', id);
    return { success: true, message: 'Law deleted successfully' };
  }

  // ========== COMPLIANCES MASTER ==========
  @Get('compliances')
  async getAllCompliances() {
    const data = await this.masterDataService.findAll('compliances_master');
    return { success: true, data };
  }

  @Get('compliances/:id')
  async getCompliance(@Param('id') id: string) {
    const data = await this.masterDataService.findById('compliances_master', id);
    return { success: true, data };
  }

  @Post('compliances')
  @Roles('admin')
  async createCompliance(@Body() createDto: any, @CurrentUser() user: JwtPayload) {
    const data = await this.masterDataService.create(
      'compliances_master',
      createDto,
    );
    this.auditService.logMasterDataChange(user.sub, 'CREATED', 'COMPLIANCE', data.id, createDto);
    return { success: true, data, message: 'Compliance template created successfully' };
  }

  @Patch('compliances/:id')
  @Roles('admin')
  async updateCompliance(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.masterDataService.update(
      'compliances_master',
      id,
      updateDto,
    );
    this.auditService.logMasterDataChange(user.sub, 'UPDATED', 'COMPLIANCE', id, updateDto);
    return { success: true, data, message: 'Compliance template updated successfully' };
  }

  @Delete('compliances/:id')
  @Roles('admin')
  async deleteCompliance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.masterDataService.delete('compliances_master', id);
    this.auditService.logMasterDataChange(user.sub, 'DELETED', 'COMPLIANCE', id);
    return { success: true, message: 'Compliance template deleted successfully' };
  }
}
