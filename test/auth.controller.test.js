const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthController } = require('../dist/auth/auth.controller');

function createResponseMock() {
  return {
    cookieCalls: [],
    clearCookieCalls: [],
    cookie(...args) {
      this.cookieCalls.push(args);
      return this;
    },
    clearCookie(...args) {
      this.clearCookieCalls.push(args);
      return this;
    },
  };
}

test('AuthController guest login sets the session cookie', async () => {
  const authService = {
    loginAsGuest: async () => ({
      token: 'token-123',
      user: { id: 'user-1', name: 'Guest User', email: 'guest@ablespace.local', isGuest: true },
    }),
  };

  const controller = new AuthController(authService);
  const response = createResponseMock();

  const result = await controller.guestLogin(response);

  assert.deepEqual(result, {
    user: { id: 'user-1', name: 'Guest User', email: 'guest@ablespace.local', isGuest: true },
  });
  assert.equal(response.cookieCalls.length, 1);
  assert.deepEqual(response.cookieCalls[0][0], 'able-space.token');
  assert.equal(response.cookieCalls[0][1], 'token-123');
  assert.equal(response.cookieCalls[0][2].httpOnly, true);
  assert.equal(response.cookieCalls[0][2].sameSite, 'lax');
});

test('AuthController logout clears the session cookie', () => {
  const controller = new AuthController({});
  const response = createResponseMock();

  const result = controller.logout(response);

  assert.deepEqual(result, { ok: true });
  assert.equal(response.clearCookieCalls.length, 1);
  assert.deepEqual(response.clearCookieCalls[0][0], 'able-space.token');
  assert.deepEqual(response.clearCookieCalls[0][1], { path: '/' });
});
