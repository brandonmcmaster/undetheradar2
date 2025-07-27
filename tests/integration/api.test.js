const http = require('http');
const { request, test, expect } = require('@playwright/test');

let server;
let context;
let baseURL;

// start server with in-memory DB

test.beforeAll(async () => {
  process.env.DB_FILE = ':memory:';
  const fs = require('fs');
  const path = require('path');
  const bin = path.join(__dirname, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  const fake = path.join(bin, 'clamscan');
  fs.writeFileSync(fake, '#!/bin/sh\nexit 0');
  fs.chmodSync(fake, 0o755);
  process.env.PATH = `${bin}:${process.env.PATH}`;

  const app = require('../../app');
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  baseURL = `http://localhost:${server.address().port}`;
  context = await request.newContext({ baseURL });
});

test.afterAll(async () => {
  await context.dispose();
  server.close();
});

test('registration and login', async () => {
  const res = await context.post('/auth/register', {
    data: { name: 'Alice', username: 'alice', password: 'pass' }
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  expect(token).toBeTruthy();

  const login = await context.post('/auth/login', {
    data: { username: 'alice', password: 'pass' }
  });
  expect(login.ok()).toBeTruthy();
  const body = await login.json();
  expect(body.token).toBeTruthy();
});

test('messaging and media upload', async () => {
  // create two users
  const u1 = await context.post('/auth/register', {
    data: { name: 'Bob', username: 'bob', password: 'pw' }
  });
  const { token: t1 } = await u1.json();

  const u2 = await context.post('/auth/register', {
    data: { name: 'Carol', username: 'carol', password: 'pw' }
  });
  const { token: t2, id: id2 } = await u2.json();

  // send message from Bob to Carol
  const msg = await context.post('/messages', {
    headers: { Authorization: `Bearer ${t1}` },
    data: { receiver_id: id2, content: 'Hello' }
  });
  expect(msg.ok()).toBeTruthy();
  const mbody = await msg.json();
  expect(mbody.content).toBe('Hello');

  // upload a file as Carol
  const fs = require('fs');
  const path = require('path');
  const tmpPath = path.join(__dirname, 'test.png');
  fs.writeFileSync(tmpPath, Buffer.from([0xff, 0xd8, 0xff]));
  const upload = await context.post('/media', {
    headers: {
      Authorization: `Bearer ${t2}`
    },
    multipart: {
      file: fs.createReadStream(tmpPath)
    }
  });
  fs.unlinkSync(tmpPath);
  expect(upload.ok()).toBeTruthy();
  const media = await upload.json();
  expect(media.id).toBeGreaterThan(0);
});

test('health check works', async () => {
  const res = await context.get('/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});
