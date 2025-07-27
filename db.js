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
      social TEXT
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
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    // Ensure users table has avatar_id column
    db.all('PRAGMA table_info(users)', [], (err, cols) => {
      if (err) return;
      const names = cols.map(c => c.name);
      if (!names.includes('avatar_id')) {
        db.run('ALTER TABLE users ADD COLUMN avatar_id INTEGER');
      }
    });
  });
};

module.exports = { db, init };
