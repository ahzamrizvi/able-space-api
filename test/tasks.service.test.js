const test = require('node:test');
const assert = require('node:assert/strict');
const { NotFoundException } = require('@nestjs/common');
const { TasksService } = require('../dist/tasks/tasks.service');

function spy(fn) {
  const calls = [];
  const wrapped = async (...args) => {
    calls.push(args);
    return fn(...args);
  };
  wrapped.calls = calls;
  return wrapped;
}

function prisma() {
  return {
    task: {
      findMany: spy(async () => []),
      findFirst: spy(async () => null),
      create: spy(async () => ({ id: 'task-1' })),
      update: spy(async () => ({ id: 'task-1' })),
      delete: spy(async () => ({ id: 'task-1' })),
    },
  };
}

test('TasksService lists tasks with filters and text search', async () => {
  const db = prisma();
  db.task.findMany = spy(async () => [
    { id: '1', title: 'Alpha task', description: 'match me', status: 'TODO', priority: 'HIGH' },
    { id: '2', title: 'Beta task', description: 'ignore me', status: 'TODO', priority: 'HIGH' },
  ]);
  const service = new TasksService(db);

  const tasks = await service.list('user-1', { q: 'match', status: 'TODO', priority: 'HIGH' });

  assert.equal(tasks.length, 1);
  assert.equal(db.task.findMany.calls.length, 1);
  assert.deepEqual(db.task.findMany.calls[0][0], {
    where: { userId: 'user-1', status: 'TODO', priority: 'HIGH' },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });
});

test('TasksService creates a task with defaults when optional fields are omitted', async () => {
  const db = prisma();
  const service = new TasksService(db);

  await service.create('user-1', { title: 'New task' });

  assert.equal(db.task.create.calls.length, 1);
  assert.deepEqual(db.task.create.calls[0][0], {
    data: {
      userId: 'user-1',
      title: 'New task',
      description: undefined,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
    },
  });
});

test('TasksService throws when updating a task that does not belong to the user', async () => {
  const db = prisma();
  const service = new TasksService(db);

  await assert.rejects(() => service.update('user-1', 'task-1', { title: 'Updated' }), NotFoundException);
});
