import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { TeamsService } from './teams.service';
import { ExportService } from './export.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ReportsController],
  providers: [ReportsService, TeamsService, ExportService],
  exports: [ReportsService, TeamsService, ExportService],
})
export class ReportsModule {}
