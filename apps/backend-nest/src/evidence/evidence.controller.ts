import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvidenceService } from './evidence.service';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('tasks/:taskId/evidence')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload-session')
  async createUploadSession(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() createDto: CreateUploadSessionDto,
  ) {
    const data = await this.evidenceService.createUploadSession(
      taskId,
      user.sub,
      createDto,
    );
    return { success: true, data };
  }

  @Post('complete')
  async completeUpload(
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
    @Body() completeDto: CompleteUploadDto,
  ) {
    const data = await this.evidenceService.completeUpload(
      taskId,
      user.sub,
      completeDto,
    );
    return {
      success: true,
      data,
      message: 'Evidence uploaded successfully',
    };
  }

  @Get()
  async findAll(@Param('taskId') taskId: string) {
    const data = await this.evidenceService.findAll(taskId);
    return { success: true, data };
  }
}

@Controller('evidence')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EvidenceManagementController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Delete(':id')
  @Roles('admin', 'task_owner')
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.evidenceService.delete(id, user.sub, user.role);
    return { success: true, message: 'Evidence deleted successfully' };
  }
}
