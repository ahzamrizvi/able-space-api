import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const guestSeedTasks: Array<Omit<Prisma.TaskCreateManyInput, 'userId'>> = [
  {
    title: 'Write API Documentation',
    description: 'Create clear and detailed API docs for the team.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Implement Search Function',
    description: 'Allow users to find tasks quickly across the workspace.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Deploy to Production',
    description: 'Ship the latest release after validation and review.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
  },
  {
    title: 'Code Review Completed',
    description: 'Review the feature branch and approve the merge.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
  },
  {
    title: 'Design Mockups Finalized',
    description: 'Finalize UI mockups for the next sprint.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
  },
  {
    title: 'Feature Testing Passed',
    description: 'QA confirmed the flow works as expected.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
  },
];

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async loginAsGuest() {
    const user = await this.prisma.user.create({
      data: {
        name: 'Guest User',
        isGuest: true,
      },
    });

    await this.prisma.task.createMany({
      data: guestSeedTasks.map((task) => ({
        ...task,
        userId: user.id,
      })),
    });

    const token = randomUUID();

    await this.prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isGuest: user.isGuest,
      },
    };
  }

  async getCurrentUser(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      isGuest: session.user.isGuest,
    };
  }
}
