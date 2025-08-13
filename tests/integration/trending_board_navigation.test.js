const http = require('http');
const { test, expect, request } = require('@playwright/test');
const { chromium } = require('playwright');

let server;
let api;
let browser;
let page;
let baseURL;
let skip = false;

async function register(data) {
  const res = await api.post('/auth/register', { data });
  expect(res.ok()).toBeTruthy();
  return res.json();
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

test('featured post opens board page with comments', async ({}, testInfo) => {
  testInfo.skip(skip, 'browser not available');
  const { token: artistToken, id: artistId } = await register({
    name: 'Artist',
    username: 'artist',
    password: 'pw',
    is_artist: true
  });
  const postRes = await api.post('/board', {
    headers: { Authorization: `Bearer ${artistToken}` },
    data: { headline: 'Hello', content: 'World' }
  });
  expect(postRes.ok()).toBeTruthy();
  const post = await postRes.json();

  const { token: fanToken, id: fanId } = await register({
    name: 'Fan',
    username: 'fan',
    password: 'pw'
  });
  await api.post(`/follow/${artistId}`, {
    headers: { Authorization: `Bearer ${fanToken}` }
  });
  await api.post(`/board/${post.id}/comments`, {
    headers: { Authorization: `Bearer ${fanToken}` },
    data: { content: 'Nice' }
  });

  await page.goto('about:blank');
  await page.evaluate(({ t, uid }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userId', String(uid));
    localStorage.setItem('isArtist', 'false');
  }, { t: fanToken, uid: fanId });

  await page.goto(`${baseURL}/`);
  await page.waitForSelector(`text=${post.headline}`);
  await page.click(`text=${post.headline}`);
  await expect(page).toHaveURL(`${baseURL}/board/${post.id}`);
  await page.waitForSelector('text=Nice');
});

