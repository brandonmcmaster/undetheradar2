const bcrypt = require('bcryptjs');

// Template data arrays; extended for demo seeding
const users = [
  {
    id: 1,
    name: 'Demo One',
    username: 'demo1',
    email: 'demo1@example.com',
    password: 'password123',
    is_artist: 0
  },
  {
    id: 2,
    name: 'Demo Artist',
    username: 'demoartist',
    email: 'demoartist@example.com',
    password: 'password123',
    is_artist: 1
  },
  {
    id: 3,
    name: 'Demo Two',
    username: 'demo2',
    email: 'demo2@example.com',
    password: 'password123',
    is_artist: 0
  }
];

// Add additional users up to 100 total
for (let i = 4; i <= 100; i++) {
  users.push({
    id: i,
    name: `User ${i}`,
    username: `user${i}`,
    email: `user${i}@example.com`,
    password: 'password123',
    is_artist: i % 10 === 0 ? 1 : 0
  });
}

const posts = [
  { user_id: 1, headline: 'Welcome', content: 'Welcome to the board' },
  { user_id: 2, headline: 'Another Post', content: 'Hello from Demo Artist' }
];

// Add additional posts up to 40 total
for (let i = 3; i <= 40; i++) {
  const userId = ((i - 1) % users.length) + 1;
  posts.push({
    user_id: userId,
    headline: `Post ${i}`,
    content: `Content for post ${i}`
  });
}

const reactions = [
  { user_id: 1, post_id: 2, reaction: 1 }
];

// Add multiple likes across users for each post
for (let i = 1; i <= 40; i++) {
  for (let j = 0; j < 5; j++) {
    const userId = ((i * 5 + j) % users.length) + 1;
    // Skip existing reaction pair
    if (!(i === 2 && userId === 1)) {
      reactions.push({ user_id: userId, post_id: i, reaction: 1 });
    }
  }
}

const comments = [
  { user_id: 2, post_id: 1, content: 'Nice post!' }
];

// Add comments for each post
for (let i = 1; i <= 40; i++) {
  for (let j = 0; j < 2; j++) {
    const userId = ((i * 2 + j) % users.length) + 1;
    // Skip existing comment pair
    if (!(i === 1 && userId === 2)) {
      comments.push({
        user_id: userId,
        post_id: i,
        content: `Comment ${j + 1} on post ${i}`
      });
    }
  }
}

const follows = [
  { follower_id: 1, followed_id: 2 },
  { follower_id: 2, followed_id: 1 }
];

const seed = (dbInstance, done) => {
  dbInstance.serialize(() => {
    dbInstance.run('PRAGMA foreign_keys = OFF');
    dbInstance.run('DELETE FROM board_comments');
    dbInstance.run('DELETE FROM board_reactions');
    dbInstance.run('DELETE FROM follows');
    dbInstance.run('DELETE FROM board_posts');
    dbInstance.run('DELETE FROM messages');
    dbInstance.run('DELETE FROM profile_media');
    dbInstance.run('DELETE FROM media');
    dbInstance.run('DELETE FROM shows');
    dbInstance.run('DELETE FROM merch');
    dbInstance.run('DELETE FROM notifications');
    dbInstance.run('DELETE FROM user_fan_badges');
    dbInstance.run('DELETE FROM user_artist_badges');
    dbInstance.run('DELETE FROM users');
    dbInstance.run("DELETE FROM sqlite_sequence WHERE name IN ('users','follows','board_posts','board_reactions','board_comments')");
    dbInstance.run('PRAGMA foreign_keys = ON');

    users.forEach(u => {
      const hashed = bcrypt.hashSync(u.password, 10);
      dbInstance.run(
        'INSERT INTO users (id, name, username, password, email, is_artist) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
        [u.id, u.name, u.username, hashed, u.email, u.is_artist]
      );
    });

    follows.forEach(f => {
      dbInstance.run(
        'INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)',
        [f.follower_id, f.followed_id]
      );
    });

    posts.forEach(p => {
      dbInstance.run(
        'INSERT INTO board_posts (user_id, headline, content) VALUES (?, ?, ?)',
        [p.user_id, p.headline, p.content]
      );
    });

    reactions.forEach(r => {
      dbInstance.run(
        'INSERT INTO board_reactions (user_id, post_id, reaction) VALUES (?, ?, ?)',
        [r.user_id, r.post_id, r.reaction]
      );
    });

    comments.forEach(c => {
      dbInstance.run(
        'INSERT INTO board_comments (user_id, post_id, content) VALUES (?, ?, ?)',
        [c.user_id, c.post_id, c.content]
      );
    });

    if (done) dbInstance.run('SELECT 1', done);
  });
};

module.exports = seed;

if (require.main === module) {
  const { db, init } = require('./db');
  init({ seedDemo: false });
  seed(db, () => db.close());
}

