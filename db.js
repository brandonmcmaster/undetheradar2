const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = process.env.DB_FILE || path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbFile);

// Initialize tables
const init = () => {
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

    // Ensure media table has all columns when upgrading from older versions
    db.all('PRAGMA table_info(media)', [], (err, cols) => {
      if (err) return;
      const names = cols.map(c => c.name);
      const add = (name, type) => {
        if (!names.includes(name)) db.run(`ALTER TABLE media ADD COLUMN ${name} ${type}`);
      };
      add('original_name', 'TEXT');
      add('mime_type', 'TEXT');
      add('size', 'INTEGER');
      add('user_id', 'INTEGER');
    });

    // Ensure users table has avatar_id and is_artist columns
    db.all('PRAGMA table_info(users)', [], (err, cols) => {
      if (err) return;
      const names = cols.map(c => c.name);
      if (!names.includes('avatar_id')) {
        db.run('ALTER TABLE users ADD COLUMN avatar_id INTEGER');
      }
      if (!names.includes('is_artist')) {
        db.run('ALTER TABLE users ADD COLUMN is_artist INTEGER DEFAULT 0');
      }
      if (!names.includes('custom_html')) {
        db.run('ALTER TABLE users ADD COLUMN custom_html TEXT');
      }
      if (!names.includes('fan_points')) {
        db.run('ALTER TABLE users ADD COLUMN fan_points INTEGER DEFAULT 0');
      }
      if (!names.includes('artist_points')) {
        db.run('ALTER TABLE users ADD COLUMN artist_points INTEGER DEFAULT 0');
      }
      if (!names.includes('fan_level_id')) {
        db.run('ALTER TABLE users ADD COLUMN fan_level_id INTEGER');
      }
      if (!names.includes('artist_level_id')) {
        db.run('ALTER TABLE users ADD COLUMN artist_level_id INTEGER');
      }
    });

    // Ensure board_posts has updated_at and headline columns
    db.all('PRAGMA table_info(board_posts)', [], (err, cols) => {
      if (err) return;
      const names = cols.map(c => c.name);
      if (!names.includes('updated_at')) {
        db.run('ALTER TABLE board_posts ADD COLUMN updated_at DATETIME');
      }
      if (!names.includes('headline')) {
        db.run("ALTER TABLE board_posts ADD COLUMN headline TEXT DEFAULT ''");
      }
    });

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
  });
};

module.exports = { db, init };
