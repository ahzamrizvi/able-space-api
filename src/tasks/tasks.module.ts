import { Module } from '@nestjs/common';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TokenAuthGuard],
})
export class TasksModule {}
