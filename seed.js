const bcrypt = require('bcryptjs');
const { db, init } = require('./db');

const seed = dbInstance => {
  const password = bcrypt.hashSync('password123', 10);
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
    dbInstance.run(
      'INSERT INTO users (name, username, password, email, is_artist) VALUES (?, ?, ?, ?, ?)',
      ['Demo One', 'demo1', password, 'demo1@example.com', 0]
    );
    dbInstance.run(
      'INSERT INTO users (name, username, password, email, is_artist) VALUES (?, ?, ?, ?, ?)',
      ['Demo Artist', 'demoartist', password, 'demoartist@example.com', 1]
    );
    dbInstance.run(
      'INSERT INTO users (name, username, password, email, is_artist) VALUES (?, ?, ?, ?, ?)',
      ['Demo Two', 'demo2', password, 'demo2@example.com', 0]
    );
    dbInstance.run('INSERT INTO follows (follower_id, followed_id) VALUES (1, 2)');
    dbInstance.run('INSERT INTO follows (follower_id, followed_id) VALUES (2, 1)');
    dbInstance.run(
      'INSERT INTO board_posts (user_id, headline, content) VALUES (1, \"Welcome\", \"Welcome to the board\")'
    );
    dbInstance.run(
      'INSERT INTO board_posts (user_id, headline, content) VALUES (2, \"Another Post\", \"Hello from Demo Artist\")'
    );
  });
};

module.exports = seed;

if (require.main === module) {
  init();
  seed(db);
}
