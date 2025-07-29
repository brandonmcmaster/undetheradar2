const { db } = require('../db');

function addPoints(userId, amount, isArtist, cb = () => {}) {
  const column = isArtist ? 'artist_points' : 'fan_points';
  db.run(
    `UPDATE users SET ${column} = COALESCE(${column},0) + ? WHERE id = ?`,
    [amount, userId],
    err => {
      if (err) return cb(err);
      checkLevel(userId, isArtist, cb);
    }
  );
}

function checkLevel(userId, isArtist, cb = () => {}) {
  const colPoints = isArtist ? 'artist_points' : 'fan_points';
  const colLevel = isArtist ? 'artist_level_id' : 'fan_level_id';
  const table = isArtist ? 'artist_levels' : 'fan_levels';
  db.get(
    `SELECT ${colPoints} AS points FROM users WHERE id = ?`,
    [userId],
    (err, row) => {
      if (err || !row) return cb(err);
      db.get(
        `SELECT id FROM ${table} WHERE threshold <= ? ORDER BY threshold DESC LIMIT 1`,
        [row.points],
        (err2, lvl) => {
          if (!err2 && lvl) {
            db.run(
              `UPDATE users SET ${colLevel} = ? WHERE id = ?`,
              [lvl.id, userId],
              cb
            );
          } else cb(err2);
        }
      );
    }
  );
}

function awardBadge(userId, badgeName, isArtist, cb = () => {}) {
  const table = isArtist ? 'artist_badges' : 'fan_badges';
  const link = isArtist ? 'user_artist_badges' : 'user_fan_badges';
  db.get(
    `SELECT id FROM ${table} WHERE badge_name = ?`,
    [badgeName],
    (err, badge) => {
      if (err || !badge) return cb(err);
      db.run(
        `INSERT OR IGNORE INTO ${link}(user_id, badge_id) VALUES(?, ?)`,
        [userId, badge.id],
        cb
      );
    }
  );
}

module.exports = { addPoints, awardBadge };
