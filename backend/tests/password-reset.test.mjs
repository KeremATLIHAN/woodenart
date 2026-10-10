import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createPasswordResetRouter } from '../src/password-reset.js';
import { verifyPassword } from '../src/passwords.js';
const require = createRequire(import.meta.url);
const express = require('express');
let time = Date.now();
let sentCode;
let writes = 0;
let stored;
const db = { async query(sql, values) {
  if (sql.startsWith('SELECT')) return [[{ u_id: 1 }]];
  writes += 1;
  stored = values[0];
  return [{ affectedRows: 1 }];
} };
const app = express();
app.use(express.json());
app.use('/reset', createPasswordResetRouter(db, {
  now: () => time, sendMail: async (_email, code) => { sentCode = code; },
}));
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/reset`;
const post = async (path, data) => {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return { status: response.status, body: await response.json() };
};
try {
  const legacyDirect = await fetch(base + '/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'Direct123!', confirmPassword: 'Direct123!' }),
  });
  assert.equal(legacyDirect.status, 404);
  assert.equal(writes, 0);

  const request = await post('/request', { email: 'test@example.com' });
  assert.equal(request.status, 200);
  assert.match(sentCode, /^\d{6}$/);
  assert.equal(writes, 0);
  assert.equal((await post('/request', { email: 'test@example.com' })).status, 429);
  const payload = { requestId: request.body.requestId, code: sentCode, password: 'NewPass123!', confirmPassword: 'NewPass123!' };
  assert.equal((await post('/confirm', { ...payload, confirmPassword: 'Wrong123!' })).status, 400);
  assert.equal(writes, 0);
  const wrongCode = sentCode === '000000' ? '111111' : '000000';
  assert.equal((await post('/confirm', { ...payload, code: wrongCode })).status, 400);
  assert.equal(writes, 0);
  assert.equal((await post('/confirm', payload)).status, 200);
  assert.equal(writes, 1);
  assert.notEqual(stored, payload.password);
  assert.equal(await verifyPassword(payload.password, stored), true);
  assert.equal(await verifyPassword('Wrong123!', stored), false);
  assert.equal(await verifyPassword('Legacy123!', 'Legacy123!'), true);
  assert.equal((await post('/confirm', payload)).status, 400);
  assert.equal(writes, 1);
  time += 61000;
  const expired = await post('/request', { email: 'test@example.com' });
  time += 601000;
  assert.equal((await post('/confirm', { ...payload, requestId: expired.body.requestId, code: sentCode })).status, 400);
  assert.equal(writes, 1);
  const locked = await post('/request', { email: 'test@example.com' });
  const latest = { ...payload, requestId: locked.body.requestId, code: sentCode };
  for (let i = 0; i < 5; i++) assert.equal((await post('/confirm', { ...latest, code: '000000' })).status, 400);
  assert.equal((await post('/confirm', latest)).status, 400);
  assert.equal(writes, 1);
  console.log('PASS: direct reset blocked, code send, cooldown, validation, wrong code, hash login, one-use, expiry, five-attempt lock');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
