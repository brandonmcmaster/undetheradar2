const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// List all board posts
router.get('/', (req, res, next) => {
  const sql = `
    SELECT board_posts.*, users.username,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = 1) AS likes,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = -1) AS dislikes,
      (SELECT COUNT(*) FROM board_comments WHERE post_id = board_posts.id) AS comments
    FROM board_posts
    JOIN users ON board_posts.user_id = users.id
    ORDER BY created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Get posts by user
router.get('/user/:id', param('id').isInt(), validate, (req, res, next) => {
  const sql = `
    SELECT board_posts.*, users.username,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = 1) AS likes,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = -1) AS dislikes,
      (SELECT COUNT(*) FROM board_comments WHERE post_id = board_posts.id) AS comments
    FROM board_posts
    JOIN users ON board_posts.user_id = users.id
    WHERE user_id = ?
    ORDER BY created_at DESC`;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
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

// Like a post
router.post('/:id/like', authenticate, param('id').isInt(), validate, (req, res, next) => {
  const sql = `INSERT INTO board_reactions(post_id, user_id, reaction)
    VALUES(?, ?, 1)
    ON CONFLICT(post_id, user_id) DO UPDATE SET reaction = 1`;
  db.run(sql, [req.params.id, req.user.id], err => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

// Dislike a post
router.post('/:id/dislike', authenticate, param('id').isInt(), validate, (req, res, next) => {
  const sql = `INSERT INTO board_reactions(post_id, user_id, reaction)
    VALUES(?, ?, -1)
    ON CONFLICT(post_id, user_id) DO UPDATE SET reaction = -1`;
  db.run(sql, [req.params.id, req.user.id], err => {
    if (err) return next(err);
    res.json({ success: true });
  });
});

// Get comments for a post
router.get('/:id/comments', param('id').isInt(), validate, (req, res, next) => {
  const sql = `SELECT board_comments.*, users.username FROM board_comments
    JOIN users ON board_comments.user_id = users.id
    WHERE post_id = ? ORDER BY created_at ASC`;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Add a comment to a post
router.post(
  '/:id/comments',
  authenticate,
  param('id').isInt(),
  body('content').trim().notEmpty(),
  validate,
  (req, res, next) => {
    const { content } = req.body;
    const sql = `INSERT INTO board_comments(post_id, user_id, content) VALUES(?, ?, ?)`;
    db.run(sql, [req.params.id, req.user.id, content], function (err) {
      if (err) return next(err);
      res.json({ id: this.lastID, post_id: req.params.id, user_id: req.user.id, content });
    });
  }
);

module.exports = router;
