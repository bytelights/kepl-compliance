import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { EvidenceModule } from '../evidence/evidence.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [EvidenceModule, ReportsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
