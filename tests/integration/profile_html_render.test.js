const http = require('http');
const { test, expect, request } = require('@playwright/test');
const { chromium } = require('playwright');

let server;
let api;
let browser;
let page;
let skip = false;
let baseURL;

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

test('custom HTML renders on profile', async ({}, testInfo) => {
  testInfo.skip(skip, 'browser not available');
  const reg = await api.post('/auth/register', {
    data: { name: 'UI', username: 'uiuser', password: 'pw' }
  });
  const { token, id } = await reg.json();
  const html = '<script>bad()</script><div id="cust"><b>Hello</b></div>';
  await api.post('/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'UI', custom_html: html }
  });

  await page.goto('about:blank');
  await page.evaluate(({ t, uid }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userId', String(uid));
  }, { t: token, uid: id });
  await page.goto(`${baseURL}/profile`);
  await page.waitForSelector('#cust');
  const inner = await page.locator('#cust').innerHTML();
  expect(inner).toBe('<b>Hello</b>');
  expect(await page.locator('#cust script').count()).toBe(0);
});
