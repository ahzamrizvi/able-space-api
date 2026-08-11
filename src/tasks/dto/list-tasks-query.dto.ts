import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class ListTasksQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  q?: string;
}
