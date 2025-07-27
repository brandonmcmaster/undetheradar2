const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// List all board posts
router.get('/', (req, res, next) => {
  db.all(
    'SELECT board_posts.*, users.username FROM board_posts JOIN users ON board_posts.user_id = users.id ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

// Get posts by user
router.get('/user/:id', param('id').isInt(), validate, (req, res, next) => {
  db.all(
    'SELECT board_posts.*, users.username FROM board_posts JOIN users ON board_posts.user_id = users.id WHERE user_id = ? ORDER BY created_at DESC',
    [req.params.id],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

// Create a board post
router.post(
  '/',
  authenticate,
  body('content').trim().notEmpty(),
  validate,
  (req, res, next) => {
    const { content } = req.body;
    db.run(
      'INSERT INTO board_posts(user_id, content) VALUES(?, ?)',
      [req.user.id, content],
      function (err) {
        if (err) return next(err);
        res.json({ id: this.lastID, user_id: req.user.id, content });
      }
    );
  }
);

module.exports = router;
