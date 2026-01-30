import { Module } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { CsvImportController } from './csv-import.controller';
import { MasterDataModule } from '../master-data/master-data.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MasterDataModule, UsersModule],
  controllers: [CsvImportController],
  providers: [CsvImportService],
  exports: [CsvImportService],
})
export class CsvImportModule {}
