const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = process.env.DB_FILE || path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbFile);

// Initialize tables
const init = (options = {}) => {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      bio TEXT,
      social TEXT,
      custom_html TEXT,
      profile_theme TEXT,
      is_artist INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      original_name TEXT,
      mime_type TEXT,
      size INTEGER,
      user_id INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist_id INTEGER NOT NULL,
      venue TEXT NOT NULL,
      date DATETIME NOT NULL,
      description TEXT,
      FOREIGN KEY(artist_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS merch (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS board_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      headline TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS board_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      reaction INTEGER NOT NULL,
      UNIQUE(post_id, user_id),
      FOREIGN KEY(post_id) REFERENCES board_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS board_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES board_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS profile_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(media_id) REFERENCES media(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      followed_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, followed_id),
      FOREIGN KEY(follower_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(followed_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fan_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_name TEXT NOT NULL,
      threshold INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS artist_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_name TEXT NOT NULL,
      threshold INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fan_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_name TEXT NOT NULL UNIQUE,
      description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS artist_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_name TEXT NOT NULL UNIQUE,
      description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_fan_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(badge_id) REFERENCES fan_badges(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_artist_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY(badge_id) REFERENCES artist_badges(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);

    // Ensure tables have required columns, ignoring errors if they already exist
    const safeAddColumn = (table, column, def) => {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`, err => {
        if (err && !/duplicate column/.test(err.message)) console.error(err);
      });
    };

    safeAddColumn('media', 'original_name', 'TEXT');
    safeAddColumn('media', 'mime_type', 'TEXT');
    safeAddColumn('media', 'size', 'INTEGER');
    safeAddColumn('media', 'user_id', 'INTEGER');

    safeAddColumn('users', 'avatar_id', 'INTEGER');
    safeAddColumn('users', 'is_artist', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'custom_html', 'TEXT');
    safeAddColumn('users', 'profile_theme', 'TEXT');
    safeAddColumn('users', 'fan_points', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'artist_points', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'fan_level_id', 'INTEGER');
    safeAddColumn('users', 'artist_level_id', 'INTEGER');

    safeAddColumn('board_posts', 'updated_at', 'DATETIME');
    safeAddColumn('board_posts', 'headline', "TEXT DEFAULT ''");

    // Seed level tables with defaults if empty
    db.get('SELECT COUNT(*) AS c FROM fan_levels', (err, row) => {
      if (!err && row.c === 0) {
        db.run("INSERT INTO fan_levels(level_name, threshold) VALUES('New Listener', 0), ('Super-Fan', 100)");
      }
    });
    db.get('SELECT COUNT(*) AS c FROM artist_levels', (err, row) => {
      if (!err && row.c === 0) {
        db.run("INSERT INTO artist_levels(level_name, threshold) VALUES('Rookie', 0), ('Headliner', 100)");
      }
    });

    db.get("SELECT COUNT(*) AS c FROM fan_badges", (err, row) => {
      if (!err && row.c === 0) {
        db.run("INSERT INTO fan_badges(badge_name, description) VALUES('First Post','Created first board post')");
      }
    });
    db.get("SELECT COUNT(*) AS c FROM artist_badges", (err, row) => {
      if (!err && row.c === 0) {
        db.run("INSERT INTO artist_badges(badge_name, description) VALUES('Debut Release','Uploaded first media')");
      }
    });

    if (options.seedDemo !== false && dbFile !== ':memory:') {
      db.get('SELECT COUNT(*) AS c FROM users', (err, row) => {
        if (!err && row.c === 0) {
          const seed = require('./seed');
          seed(db);
        }
      });
    }
  });
};

module.exports = { db, init };
