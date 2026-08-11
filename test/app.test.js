const test = require('node:test');
const assert = require('node:assert/strict');
const { AppController } = require('../dist/app.controller');

test('AppController health check returns ok', () => {
  const controller = new AppController();
  assert.deepEqual(controller.health(), { status: 'ok', service: 'able-space-api' });
});
