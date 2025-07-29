const http = require('http');
const { test, expect, request } = require('@playwright/test');

let server;
let context;
let baseURL;

test.beforeAll(async () => {
  process.env.DB_FILE = ':memory:';
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

test('unknown routes serve index.html', async () => {
  const res = await context.get('/some/random/path');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text.startsWith('<!DOCTYPE html>')).toBeTruthy();
});
