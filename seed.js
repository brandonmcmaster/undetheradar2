const bcrypt = require('bcryptjs');

// Template data arrays; modify or extend as needed
const users = [
  {
    name: 'Demo One',
    username: 'demo1',
    email: 'demo1@example.com',
    password: 'password123',
    is_artist: 0
  },
  {
    name: 'Demo Artist',
    username: 'demoartist',
    email: 'demoartist@example.com',
    password: 'password123',
    is_artist: 1
  },
  {
    name: 'Demo Two',
    username: 'demo2',
    email: 'demo2@example.com',
    password: 'password123',
    is_artist: 0
  }
  // Add more users here
];

const posts = [
  { user_id: 1, headline: 'Welcome', content: 'Welcome to the board' },
  { user_id: 2, headline: 'Another Post', content: 'Hello from Demo Artist' }
  // Add more posts here
];

const reactions = [
  { user_id: 1, post_id: 2, reaction: 1 }
  // Add more reactions here (reaction: 1 for like, -1 for dislike)
];

const comments = [
  { user_id: 2, post_id: 1, content: 'Nice post!' }
  // Add more comments here
];

const follows = [
  { follower_id: 1, followed_id: 2 },
  { follower_id: 2, followed_id: 1 }
  // Add more follows here
];

const seed = dbInstance => {
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
    dbInstance.run('PRAGMA foreign_keys = ON');

    users.forEach(u => {
      const hashed = bcrypt.hashSync(u.password, 10);
      dbInstance.run(
        'INSERT INTO users (name, username, password, email, is_artist) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.username, hashed, u.email, u.is_artist]
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
  });
};

module.exports = seed;

if (require.main === module) {
  const { db, init } = require('./db');
  init({ seedDemo: false });
  seed(db);
  db.close();
}

