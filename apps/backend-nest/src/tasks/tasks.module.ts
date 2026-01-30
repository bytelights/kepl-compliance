import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { MasterDataModule } from '../master-data/master-data.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MasterDataModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
