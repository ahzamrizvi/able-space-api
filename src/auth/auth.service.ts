import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const guestSeedTasks: Array<Omit<Prisma.TaskCreateManyInput, 'userId'>> = [
  {
    title: 'Write API Documentation',
    description:
      'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2026-08-18T00:00:00.000Z'),
  },
  {
    title: 'Implement Search Function',
    description: 'Allow users to find tasks quickly across the workspace.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-08-20T00:00:00.000Z'),
  },
  {
    title: 'Deploy to Production',
    description: 'Ship the latest release after validation and review.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: new Date('2026-08-22T00:00:00.000Z'),
  },
  {
    title: 'Code Review Completed',
    description: 'Review the feature branch and approve the merge.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2026-08-24T00:00:00.000Z'),
  },
  {
    title: 'Design Mockups Finalized',
    description: 'Finalize UI mockups for the next sprint.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-08-26T00:00:00.000Z'),
  },
  {
    title: 'Feature Testing Passed',
    description: 'QA confirmed the flow works as expected.',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-08-28T00:00:00.000Z'),
  },
  {
    title: 'UI Review',
    description: 'Review the latest interface changes before release.',
    status: TaskStatus.ON_HOLD,
    priority: TaskPriority.LOW,
    dueDate: new Date('2026-08-30T00:00:00.000Z'),
  },
  {
    title: 'Backend Integration',
    description: 'Waiting on API contract updates before merge.',
    status: TaskStatus.ON_HOLD,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-09-01T00:00:00.000Z'),
  },
  {
    title: 'User Feedback',
    description: 'Collect input from users before the next release decision.',
    status: TaskStatus.ON_HOLD,
    priority: TaskPriority.LOW,
    dueDate: new Date('2026-09-03T00:00:00.000Z'),
  },
  {
    title: 'Performance Review',
    description: 'Review optimization findings and plan follow-up work.',
    status: TaskStatus.ON_HOLD,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2026-09-05T00:00:00.000Z'),
  },
];

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureGuestSeedTasks(userId: string) {
    const existingTasks = await this.prisma.task.findMany({
      where: { userId },
      select: { title: true },
    });

    const existingTitles = new Set(existingTasks.map((task) => task.title));
    const missingTasks = guestSeedTasks.filter(
      (task) => !existingTitles.has(task.title),
    );

    if (missingTasks.length > 0) {
      await this.prisma.task.createMany({
        data: missingTasks.map((task) => ({
          ...task,
          userId,
        })),
      });
    }
  }

  async loginAsGuest() {
    const user = await this.prisma.user.upsert({
      where: { email: 'guest@ablespace.local' },
      update: { name: 'Guest User', isGuest: true },
      create: {
        name: 'Guest User',
        email: 'guest@ablespace.local',
        isGuest: true,
      },
    });

    await this.ensureGuestSeedTasks(user.id);

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

    if (session.user.isGuest) {
      await this.ensureGuestSeedTasks(session.user.id);
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      isGuest: session.user.isGuest,
    };
  }
}
