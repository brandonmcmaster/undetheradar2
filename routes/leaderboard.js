const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/fans', (req, res, next) => {
  db.all(
    'SELECT id, name, username, fan_points FROM users WHERE is_artist = 0 ORDER BY fan_points DESC LIMIT 10',
    [],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

router.get('/artists', (req, res, next) => {
  db.all(
    'SELECT id, name, username, artist_points FROM users WHERE is_artist = 1 ORDER BY artist_points DESC LIMIT 10',
    [],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

module.exports = router;
