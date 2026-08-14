const test = require('node:test');
const assert = require('node:assert/strict');
const { UnauthorizedException } = require('@nestjs/common');
const { AuthService } = require('../dist/auth/auth.service');

const prisma = () => ({
  user: {
    create: spy(async () => ({ id: 'user-1', name: 'Guest User', email: null, isGuest: true })),
    upsert: spy(async () => ({ id: 'user-1', name: 'Guest User', email: null, isGuest: true })),
  },
  task: {
    createMany: spy(async () => ({ count: 3 })),
    findMany: spy(async () => []),
  },
  session: {
    create: spy(async () => ({})),
    findUnique: spy(async () => null),
  },
});

function spy(fn) {
  const calls = [];
  const wrapped = async (...args) => {
    calls.push(args);
    return fn(...args);
  };
  wrapped.calls = calls;
  return wrapped;
}

test('AuthService creates a guest session and seeds starter tasks', async () => {
  const db = prisma();
  const service = new AuthService(db);

  const result = await service.loginAsGuest();

  assert.equal(typeof result.token, 'string');
  assert.equal(result.user.id, 'user-1');
  assert.equal(result.user.name, 'Guest User');
  assert.equal(result.user.email, null);
  assert.equal(result.user.isGuest, true);
  assert.equal(db.user.upsert.calls.length, 1);
  assert.equal(db.task.createMany.calls.length, 1);
  assert.equal(db.session.create.calls.length, 1);
  assert.equal(db.task.createMany.calls[0][0].data.length, 10);
});

test('AuthService returns the current user for a valid session', async () => {
  const db = prisma();
  db.session.findUnique = spy(async () => ({
    expiresAt: new Date(Date.now() + 1000),
    user: { id: 'user-1', name: 'Guest User', email: null, isGuest: true },
  }));
  const service = new AuthService(db);

  await assert.doesNotReject(() => service.getCurrentUser('test-token'));
  const currentUser = await service.getCurrentUser('test-token');
  assert.deepEqual(currentUser, {
    id: 'user-1',
    name: 'Guest User',
    email: null,
    isGuest: true,
  });
});

test('AuthService rejects an expired session', async () => {
  const db = prisma();
  db.session.findUnique = spy(async () => ({
    expiresAt: new Date(Date.now() - 1000),
    user: { id: 'user-1', name: 'Guest User', email: null, isGuest: true },
  }));
  const service = new AuthService(db);

  await assert.rejects(() => service.getCurrentUser('test-token'), UnauthorizedException);
});
