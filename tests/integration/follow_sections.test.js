const http = require('http');
const { test, expect, request, chromium } = require('@playwright/test');

let server;
let api;
let browser;
let page;
let skip = false;
let baseURL;

async function register(data) {
  const res = await api.post('/auth/register', { data });
  expect(res.ok()).toBeTruthy();
  return await res.json();
}

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
  api = await request.newContext({ baseURL });
  try {
    browser = await chromium.launch();
    page = await browser.newPage();
  } catch (e) {
    skip = true;
  }
});

test.afterAll(async () => {
  await api.dispose();
  if (browser) await browser.close();
  server.close();
});

test('merch and shows require following', async ({}, testInfo) => {
  testInfo.skip(skip, 'browser not available');
  const artist = await register({ name: 'Art', username: 'artistf', password: 'pw', is_artist: true });
  const viewer = await register({ name: 'View', username: 'viewerf', password: 'pw' });

  await api.post('/merch', {
    headers: { Authorization: `Bearer ${artist.token}` },
    data: { product_name: 'Shirt', price: 10, stock: 1 }
  });

  await api.post('/shows', {
    headers: { Authorization: `Bearer ${artist.token}` },
    data: { venue: 'Club', date: '2030-01-01', description: 'Gig' }
  });

  await page.goto('about:blank');
  await page.evaluate(({ t, uid }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userId', String(uid));
  }, { t: viewer.token, uid: viewer.id });

  await page.goto(`${baseURL}/artists/${artist.id}`);

  await page.waitForSelector('text=Follow this user to view their merch.');
  await page.waitForSelector('text=Follow this user to view their shows.');
});
