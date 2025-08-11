const http = require('http');
const { request, test, expect } = require('@playwright/test');

let server;
let context;
let baseURL;

async function register(data) {
  const res = await context.post('/auth/register', { data });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.is_artist).toBe(Boolean(data.is_artist));
  return body;
}

// start server with in-memory DB

test.beforeAll(async () => {
  process.env.DB_FILE = ':memory:';
  process.env.RATE_LIMIT_MAX = 1000;
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
  const { token, is_artist } = await register({
    name: 'Alice',
    username: 'alice',
    password: 'pass'
  });
  expect(token).toBeTruthy();
  expect(is_artist).toBe(false);

  const login = await context.post('/auth/login', {
    data: { username: 'alice', password: 'pass' }
  });
  expect(login.ok()).toBeTruthy();
  const body = await login.json();
  expect(body.token).toBeTruthy();
  expect(body.is_artist).toBe(false);
});

test('messaging and media upload', async () => {
  // create two users
  const { token: t1 } = await register({
    name: 'Bob',
    username: 'bob',
    password: 'pw'
  });

  const { token: t2, id: id2 } = await register({
    name: 'Carol',
    username: 'carol',
    password: 'pw'
  });

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

test('board post creation', async () => {
  const { token, id } = await register({
    name: 'Dana',
    username: 'dana',
    password: 'pw'
  });
  const post = await context.post('/board', {
    headers: { Authorization: `Bearer ${token}` },
    data: { headline: 'Test', content: 'Hello board' }
  });
  expect(post.ok()).toBeTruthy();
  const all = await context.get(`/board/user/${id}`);
  expect(all.ok()).toBeTruthy();
  const items = await all.json();
  expect(items.find(p => p.headline === 'Test' && p.content === 'Hello board')).toBeTruthy();
});

test('board post interactions', async () => {
  const { token: t1, id: id1 } = await register({
    name: 'Ed',
    username: 'ed',
    password: 'pw'
  });
  const { token: t2 } = await register({
    name: 'Fay',
    username: 'fay',
    password: 'pw'
  });

  const created = await context.post('/board', {
    headers: { Authorization: `Bearer ${t1}` },
    data: { headline: 'Hello', content: 'Post' }
  });
  const { id } = await created.json();

  const like = await context.post(`/board/${id}/like`, {
    headers: { Authorization: `Bearer ${t2}` }
  });
  expect(like.ok()).toBeTruthy();

  const comment = await context.post(`/board/${id}/comments`, {
    headers: { Authorization: `Bearer ${t2}` },
    data: { content: 'Nice' }
  });
  expect(comment.ok()).toBeTruthy();

  const posts = await context.get(`/board/user/${id1}`);
  const arr = await posts.json();
  const p = arr.find(x => x.id === id);
  expect(p.likes).toBe(1);

  const comms = await context.get(`/board/${id}/comments`);
  const list = await comms.json();
  expect(list.find(c => c.content === 'Nice')).toBeTruthy();
});

test('merch and shows feed require following', async () => {
  const { token: artistToken, id: artistId } = await register({
    name: 'FeedArtist',
    username: 'feedartist',
    password: 'pw',
    is_artist: true
  });
  await context.post('/merch', {
    headers: { Authorization: `Bearer ${artistToken}` },
    data: { product_name: 'Hat', price: 5 }
  });
  await context.post('/shows', {
    headers: { Authorization: `Bearer ${artistToken}` },
    data: { venue: 'Club', date: '2030-01-01' }
  });

  const { token: fanToken } = await register({
    name: 'FeedFan',
    username: 'feedfan',
    password: 'pw'
  });

  let merch = await context.get('/merch/feed', { headers: { Authorization: `Bearer ${fanToken}` } });
  expect((await merch.json()).length).toBe(0);
  let shows = await context.get('/shows/feed', { headers: { Authorization: `Bearer ${fanToken}` } });
  expect((await shows.json()).length).toBe(0);

  await context.post(`/follow/${artistId}`, { headers: { Authorization: `Bearer ${fanToken}` } });

  merch = await context.get('/merch/feed', { headers: { Authorization: `Bearer ${fanToken}` } });
  expect((await merch.json()).length).toBe(1);
  shows = await context.get('/shows/feed', { headers: { Authorization: `Bearer ${fanToken}` } });
  expect((await shows.json()).length).toBe(1);
});

test('board post editing', async () => {
  const { token, id: userId } = await register({
    name: 'Mia',
    username: 'mia',
    password: 'pw'
  });
  const created = await context.post('/board', {
    headers: { Authorization: `Bearer ${token}` },
    data: { headline: 'Orig', content: 'Original' }
  });
  const { id } = await created.json();
  const edit = await context.put(`/board/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { headline: 'Changed', content: 'Edited' }
  });
  expect(edit.ok()).toBeTruthy();
  const posts = await context.get(`/board/user/${userId}`);
  const arr = await posts.json();
  const updated = arr.find(p => p.id === id);
  expect(updated.headline).toBe('Changed');
  expect(updated.content).toBe('Edited');
  expect(updated.updated_at).toBeTruthy();
});

test('comment editing and post deletion', async () => {
  const { token: t1, id: id1 } = await register({
    name: 'Ken',
    username: 'ken',
    password: 'pw'
  });
  const { token: t2 } = await register({
    name: 'Liz',
    username: 'liz',
    password: 'pw'
  });

  const created = await context.post('/board', {
    headers: { Authorization: `Bearer ${t1}` },
    data: { headline: 'Temp', content: 'Temp' }
  });
  const { id } = await created.json();
  const com = await context.post(`/board/${id}/comments`, {
    headers: { Authorization: `Bearer ${t2}` },
    data: { content: 'First' }
  });
  const { id: cid } = await com.json();

  const edit = await context.put(`/board/comments/${cid}`, {
    headers: { Authorization: `Bearer ${t2}` },
    data: { content: 'Updated' }
  });
  expect(edit.ok()).toBeTruthy();
  const list1 = await context.get(`/board/${id}/comments`);
  const arr1 = await list1.json();
  expect(arr1.find(c => c.id === cid).content).toBe('Updated');

  const delc = await context.delete(`/board/comments/${cid}`, {
    headers: { Authorization: `Bearer ${t2}` }
  });
  expect(delc.ok()).toBeTruthy();
  const list2 = await context.get(`/board/${id}/comments`);
  const arr2 = await list2.json();
  expect(arr2.length).toBe(0);

  const del = await context.delete(`/board/${id}`, {
    headers: { Authorization: `Bearer ${t1}` }
  });
  expect(del.ok()).toBeTruthy();
  const posts = await context.get(`/board/user/${id1}`);
  const after = await posts.json();
  expect(after.find(p => p.id === id)).toBeUndefined();
});

test('health check works', async () => {
  const res = await context.get('/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('shows endpoints work', async () => {
  const { token, id } = await register({
    name: 'Greg',
    username: 'greg',
    password: 'pw'
  });

  const create = await context.post('/shows', {
    headers: { Authorization: `Bearer ${token}` },
    data: { venue: 'The Spot', date: '2030-01-01', description: 'Party' }
  });
  expect(create.ok()).toBeTruthy();
  const { id: showId } = await create.json();

  const all = await context.get('/shows');
  expect(all.ok()).toBeTruthy();
  const list = await all.json();
  expect(list.find(s => s.id === showId)).toBeTruthy();

  const userShows = await context.get(`/shows/user/${id}`);
  expect(userShows.ok()).toBeTruthy();
  const userList = await userShows.json();
  expect(userList.find(s => s.id === showId)).toBeTruthy();
});

test('merch endpoints work', async () => {
  const { token, id } = await register({
    name: 'Hank',
    username: 'hank',
    password: 'pw'
  });

  const create = await context.post('/merch', {
    headers: { Authorization: `Bearer ${token}` },
    data: { product_name: 'Tee', price: 10.5, stock: 5 }
  });
  expect(create.ok()).toBeTruthy();
  const { id: merchId } = await create.json();

  const all = await context.get('/merch');
  expect(all.ok()).toBeTruthy();
  const list = await all.json();
  expect(list.find(m => m.id === merchId)).toBeTruthy();

  const userMerch = await context.get(`/merch/user/${id}`);
  expect(userMerch.ok()).toBeTruthy();
  const userList = await userMerch.json();
  expect(userList.find(m => m.id === merchId)).toBeTruthy();
});

test('avatar upload works', async () => {
  const { token, id } = await register({
    name: 'Ian',
    username: 'ian',
    password: 'pw'
  });
  const fs = require('fs');
  const path = require('path');
  const tmp = path.join(__dirname, 'avatar.png');
  fs.writeFileSync(tmp, Buffer.from([0xff, 0xd8, 0xff]));
  const up = await context.post('/users/avatar', {
    headers: { Authorization: `Bearer ${token}` },
    multipart: { avatar: fs.createReadStream(tmp) }
  });
  fs.unlinkSync(tmp);
  expect(up.ok()).toBeTruthy();
  const data = await up.json();
  expect(data.avatar_id).toBeGreaterThan(0);
  const user = await context.get(`/users/${id}`);
  const ujson = await user.json();
  expect(ujson.avatar_id).toBe(data.avatar_id);
});

test('profile media upload and listing works', async () => {
  const { token, id } = await register({
    name: 'Jo',
    username: 'jo',
    password: 'pw'
  });
  const fs = require('fs');
  const path = require('path');
  const tmp = path.join(__dirname, 'post.png');
  fs.writeFileSync(tmp, Buffer.from([0xff, 0xd8, 0xff]));
  const up = await context.post('/profile-media', {
    headers: { Authorization: `Bearer ${token}` },
    multipart: { file: fs.createReadStream(tmp) }
  });
  fs.unlinkSync(tmp);
  expect(up.ok()).toBeTruthy();
  const { media_id } = await up.json();
  expect(media_id).toBeGreaterThan(0);
  const list = await context.get(`/profile-media/user/${id}`);
  expect(list.ok()).toBeTruthy();
  const arr = await list.json();
  expect(arr.find(m => m.id === media_id)).toBeTruthy();
});

test('metrics endpoint responds', async () => {
  const res = await context.get('/metrics');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.totalRequests).toBeGreaterThan(0);
  expect(typeof body.totalErrors).toBe('number');
  expect(typeof body.avgResponseTime).toBe('number');
});

test('profile custom HTML is sanitized and stored', async () => {
  const { token, id } = await register({
    name: 'HTML',
    username: 'htmluser',
    password: 'pw'
  });

  const html = '<script>alert(1)</script><b>hi</b>';
  const update = await context.post('/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'HTML', custom_html: html }
  });
  expect(update.ok()).toBeTruthy();
  const user = await context.get(`/users/${id}`);
  const data = await user.json();
  expect(data.custom_html).toBe('<b>hi</b>');
});

test('updating only theme keeps existing fields', async () => {
  const { token, id } = await register({
    name: 'Theme',
    username: 'themeuser',
    password: 'pw'
  });
  const update = await context.post('/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { profile_theme: 'dark' }
  });
  expect(update.ok()).toBeTruthy();
  const user = await context.get(`/users/${id}`);
  const data = await user.json();
  expect(data.name).toBe('Theme');
  expect(data.profile_theme).toBe('dark');
});

test('user type filtering works', async () => {
  await register({
    name: 'Artist',
    username: 'artist',
    password: 'pw',
    is_artist: true
  });
  await register({
    name: 'Regular',
    username: 'regular',
    password: 'pw',
    is_artist: false
  });
  const arts = await context.get('/users?type=artist');
  const artList = await arts.json();
  expect(artList.every(u => u.is_artist === 1)).toBeTruthy();
  const fans = await context.get('/users?type=user');
  const fanList = await fans.json();
  expect(fanList.every(u => u.is_artist === 0)).toBeTruthy();
});

test('user search works', async () => {
  await register({
    name: 'Alice',
    username: 'alice123',
    password: 'pw',
    is_artist: true
  });
  await register({
    name: 'Bob',
    username: 'bobby',
    password: 'pw',
    is_artist: false
  });
  await register({
    name: 'Charlie',
    username: 'charlie',
    password: 'pw',
    is_artist: true
  });

  const search = await context.get('/users?q=obb');
  const searchList = await search.json();
  expect(searchList.length).toBe(1);
  expect(searchList[0].username).toBe('bobby');

  const letter = await context.get('/users?letter=C&type=artist');
  const letterList = await letter.json();
  expect(letterList.length).toBe(1);
  expect(letterList[0].username).toBe('charlie');
});

test('follow and notifications work', async () => {
  const { token: t1, id: id1 } = await register({
    name: 'A',
    username: 'aa',
    password: 'pw'
  });
  const { token: t2, id: id2 } = await register({
    name: 'B',
    username: 'bb',
    password: 'pw'
  });

  const follow = await context.post(`/follow/${id2}`, {
    headers: { Authorization: `Bearer ${t1}` }
  });
  expect(follow.ok()).toBeTruthy();

  const status = await context.get(`/follow/${id2}`, {
    headers: { Authorization: `Bearer ${t1}` }
  });
  const st = await status.json();
  expect(st.following).toBe(true);

  const notes = await context.get('/notifications', {
    headers: { Authorization: `Bearer ${t2}` }
  });
  const arr = await notes.json();
  expect(arr.length).toBeGreaterThan(0);
  const mark = await context.post(`/notifications/${arr[0].id}/read`, {
    headers: { Authorization: `Bearer ${t2}` }
  });
  expect(mark.ok()).toBeTruthy();
});

test('notifications unread count works', async () => {
  const { token: t1 } = await register({
    name: 'C',
    username: 'cc',
    password: 'pw'
  });
  const { token: t2, id: id2 } = await register({
    name: 'D',
    username: 'dd',
    password: 'pw'
  });

  await context.post(`/follow/${id2}`, {
    headers: { Authorization: `Bearer ${t1}` }
  });

  const count1 = await context.get('/notifications/unread_count', {
    headers: { Authorization: `Bearer ${t2}` }
  });
  const { count } = await count1.json();
  expect(count).toBeGreaterThan(0);

  const list = await context.get('/notifications', {
    headers: { Authorization: `Bearer ${t2}` }
  });
  const arr = await list.json();
  await context.post(`/notifications/${arr[0].id}/read`, {
    headers: { Authorization: `Bearer ${t2}` }
  });

  const count2 = await context.get('/notifications/unread_count', {
    headers: { Authorization: `Bearer ${t2}` }
  });
  const { count: newCount } = await count2.json();
  expect(newCount).toBe(count - 1);
});

test('feed endpoints return followed content', async () => {
  const { token: ta } = await register({
    name: 'FeedA',
    username: 'feeda',
    password: 'pw'
  });

  const { token: tb, id: idB } = await register({
    name: 'FeedB',
    username: 'feedb',
    password: 'pw'
  });

  await context.post('/board', {
    headers: { Authorization: `Bearer ${tb}` },
    data: { headline: 'Hello', content: 'World' }
  });
  await context.post('/shows', {
    headers: { Authorization: `Bearer ${tb}` },
    data: { venue: 'Venue', date: '2031-01-01' }
  });
  await context.post('/merch', {
    headers: { Authorization: `Bearer ${tb}` },
    data: { product_name: 'Item', price: 5 }
  });

  const fs = require('fs');
  const path = require('path');
  const tmp = path.join(__dirname, 'feed.png');
  fs.writeFileSync(tmp, Buffer.from([0xff, 0xd8, 0xff]));
  await context.post('/media', {
    headers: { Authorization: `Bearer ${tb}` },
    multipart: { file: fs.createReadStream(tmp) }
  });
  fs.unlinkSync(tmp);

  let feed = await context.get('/board/feed', {
    headers: { Authorization: `Bearer ${ta}` }
  });
  expect((await feed.json()).length).toBe(0);

  const mediaFeed1 = await context.get('/media/feed', {
    headers: { Authorization: `Bearer ${ta}` }
  });
  expect((await mediaFeed1.json()).length).toBe(0);

  await context.post(`/follow/${idB}`, {
    headers: { Authorization: `Bearer ${ta}` }
  });

  feed = await context.get('/board/feed', {
    headers: { Authorization: `Bearer ${ta}` }
  });
  const posts = await feed.json();
  expect(posts.length).toBe(1);

  const shows = await (await context.get('/shows/feed', { headers: { Authorization: `Bearer ${ta}` } })).json();
  expect(shows.length).toBe(1);

  const merch = await (await context.get('/merch/feed', { headers: { Authorization: `Bearer ${ta}` } })).json();
  expect(merch.length).toBe(1);

  const mediaFeed2 = await context.get('/media/feed', {
    headers: { Authorization: `Bearer ${ta}` }
  });
  expect((await mediaFeed2.json()).length).toBe(1);
});

test('board feed filters artists and friends', async () => {
  const { token: follower } = await register({
    name: 'Follower',
    username: 'follower',
    password: 'pw'
  });

  const { token: friendToken, id: friendId } = await register({
    name: 'Friend',
    username: 'friend',
    password: 'pw'
  });

  const { token: artistToken, id: artistId } = await register({
    name: 'Artist',
    username: 'artistfeed',
    password: 'pw',
    is_artist: true
  });

  await context.post('/board', {
    headers: { Authorization: `Bearer ${friendToken}` },
    data: { headline: 'Friend post', content: 'hello' }
  });
  await context.post('/board', {
    headers: { Authorization: `Bearer ${artistToken}` },
    data: { headline: 'Artist post', content: 'art' }
  });

  await context.post(`/follow/${friendId}`, {
    headers: { Authorization: `Bearer ${follower}` }
  });
  await context.post(`/follow/${artistId}`, {
    headers: { Authorization: `Bearer ${follower}` }
  });

  const combined = await (await context.get('/board/feed', {
    headers: { Authorization: `Bearer ${follower}` }
  })).json();
  expect(combined.length).toBe(2);

  const artFeed = await (await context.get('/board/feed/artists', {
    headers: { Authorization: `Bearer ${follower}` }
  })).json();
  expect(artFeed.length).toBe(1);
  expect(artFeed[0].user_id).toBe(artistId);

  const friendFeed = await (await context.get('/board/feed/friends', {
    headers: { Authorization: `Bearer ${follower}` }
  })).json();
  expect(friendFeed.length).toBe(1);
  expect(friendFeed[0].user_id).toBe(friendId);
});

test('leaderboard tracks points', async () => {
  const { token: fanToken, id: fanId } = await register({
    name: 'Fan',
    username: 'fanuser',
    password: 'pw'
  });

  const { token: artToken, id: artId } = await register({
    name: 'Artist',
    username: 'artuser',
    password: 'pw',
    is_artist: true
  });

  await context.post('/board', {
    headers: { Authorization: `Bearer ${fanToken}` },
    data: { headline: 'Hi', content: 'there' }
  });

  await context.post('/board', {
    headers: { Authorization: `Bearer ${artToken}` },
    data: { headline: 'Art', content: 'post' }
  });

  const fans = await (await context.get('/leaderboard/fans')).json();
  expect(fans.some(u => u.id === fanId)).toBeTruthy();
  const artists = await (await context.get('/leaderboard/artists')).json();
  expect(artists.some(u => u.id === artId)).toBeTruthy();

  const fanData = await (await context.get(`/users/${fanId}`)).json();
  expect(fanData.fan_points).toBeGreaterThan(0);
  expect(fanData.artist_points).toBe(0);
});

test('returns 404 for missing user', async () => {
  const res = await context.get('/users/9999');
  expect(res.status()).toBe(404);
});

test('profile update returns 404 for missing user', async () => {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: 9999, username: 'ghost' }, 'secret');
  const res = await context.post('/users', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: 'Ghost' }
  });
  expect(res.status()).toBe(404);
});
