import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, query: ListTasksQueryDto) {
    const where: Prisma.TaskWhereInput = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    return this.prisma.task
      .findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      })
      .then((tasks) => {
        if (!query.q) {
          return tasks;
        }

        const needle = query.q.toLowerCase();
        return tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(needle) ||
            (task.description ?? '').toLowerCase().includes(needle),
        );
      });
  }

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.ensureOwnership(userId, id);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwnership(userId, id);

    return this.prisma.task.delete({ where: { id } });
  }

  private async ensureOwnership(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }
}
