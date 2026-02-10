import { Module } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import {
  EvidenceController,
  EvidenceManagementController,
} from './evidence.controller';
import { SharePointService } from './sharepoint.service';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TasksModule, AuditModule],
  controllers: [EvidenceController, EvidenceManagementController],
  providers: [EvidenceService, SharePointService],
  exports: [EvidenceService, SharePointService],
})
export class EvidenceModule {}
