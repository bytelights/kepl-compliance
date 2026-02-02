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
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('master-data')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // ========== ENTITIES ==========
  @Get('entities')
  async getAllEntities() {
    const data = await this.masterDataService.findAll('entities');
    return { success: true, data };
  }

  @Post('entities')
  @Roles('admin')
  async createEntity(@Body() createDto: CreateMasterDataDto) {
    const data = await this.masterDataService.create('entities', createDto);
    return { success: true, data, message: 'Entity created successfully' };
  }

  @Patch('entities/:id')
  @Roles('admin')
  async updateEntity(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
  ) {
    const data = await this.masterDataService.update('entities', id, updateDto);
    return { success: true, data, message: 'Entity updated successfully' };
  }

  @Delete('entities/:id')
  @Roles('admin')
  async deleteEntity(@Param('id') id: string) {
    await this.masterDataService.delete('entities', id);
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
  async createDepartment(@Body() createDto: CreateMasterDataDto) {
    const data = await this.masterDataService.create('departments', createDto);
    return { success: true, data, message: 'Department created successfully' };
  }

  @Patch('departments/:id')
  @Roles('admin')
  async updateDepartment(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
  ) {
    const data = await this.masterDataService.update(
      'departments',
      id,
      updateDto,
    );
    return { success: true, data, message: 'Department updated successfully' };
  }

  @Delete('departments/:id')
  @Roles('admin')
  async deleteDepartment(@Param('id') id: string) {
    await this.masterDataService.delete('departments', id);
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
  async createLaw(@Body() createDto: CreateMasterDataDto) {
    const data = await this.masterDataService.create('laws', createDto);
    return { success: true, data, message: 'Law created successfully' };
  }

  @Patch('laws/:id')
  @Roles('admin')
  async updateLaw(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
  ) {
    const data = await this.masterDataService.update('laws', id, updateDto);
    return { success: true, data, message: 'Law updated successfully' };
  }

  @Delete('laws/:id')
  @Roles('admin')
  async deleteLaw(@Param('id') id: string) {
    await this.masterDataService.delete('laws', id);
    return { success: true, message: 'Law deleted successfully' };
  }

  // ========== COMPLIANCES MASTER ==========
  @Get('compliances')
  async getAllCompliances() {
    const data = await this.masterDataService.findAll('compliances_master');
    return { success: true, data };
  }

  @Post('compliances')
  @Roles('admin')
  async createCompliance(@Body() createDto: CreateMasterDataDto) {
    const data = await this.masterDataService.create(
      'compliances_master',
      createDto,
    );
    return { success: true, data, message: 'Compliance created successfully' };
  }

  @Patch('compliances/:id')
  @Roles('admin')
  async updateCompliance(
    @Param('id') id: string,
    @Body() updateDto: UpdateMasterDataDto,
  ) {
    const data = await this.masterDataService.update(
      'compliances_master',
      id,
      updateDto,
    );
    return { success: true, data, message: 'Compliance updated successfully' };
  }

  @Delete('compliances/:id')
  @Roles('admin')
  async deleteCompliance(@Param('id') id: string) {
    await this.masterDataService.delete('compliances_master', id);
    return { success: true, message: 'Compliance deleted successfully' };
  }
}
