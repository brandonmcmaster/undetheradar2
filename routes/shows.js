const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// List all shows
router.get('/', (req, res, next) => {
  db.all('SELECT * FROM shows ORDER BY date ASC', [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Get shows for a specific artist
router.get('/user/:id', param('id').isInt(), validate, (req, res, next) => {
  db.all(
    'SELECT * FROM shows WHERE artist_id = ? ORDER BY date ASC',
    [req.params.id],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

// Create a new show
router.post(
  '/',
  authenticate,
  body('venue').trim().notEmpty().escape(),
  body('date').notEmpty(),
  body('description').optional().escape(),
  validate,
  (req, res, next) => {
    const { venue, date, description } = req.body;
    db.run(
      'INSERT INTO shows(artist_id, venue, date, description) VALUES(?,?,?,?)',
      [req.user.id, venue, date, description],
      function (err) {
        if (err) return next(err);
        res.json({ id: this.lastID });
      }
    );
  }
);

module.exports = router;
