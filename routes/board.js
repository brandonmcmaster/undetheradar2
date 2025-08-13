const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const notify = require('../utils/notify');
const { addPoints, awardBadge } = require('../utils/gamify');

// Get posts by user
router.get('/user/:id', param('id').isInt(), validate, (req, res, next) => {
  const sql = `
    SELECT board_posts.*, users.username, users.name, users.avatar_id, users.is_artist,
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

// Get posts from followed users
router.get('/feed', authenticate, (req, res, next) => {
  const sql = `
    SELECT board_posts.*, users.username, users.name, users.avatar_id, users.is_artist,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = 1) AS likes,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = -1) AS dislikes,
      (SELECT COUNT(*) FROM board_comments WHERE post_id = board_posts.id) AS comments
    FROM board_posts
    JOIN users ON board_posts.user_id = users.id
    JOIN follows ON follows.followed_id = board_posts.user_id
    WHERE follows.follower_id = ?
    ORDER BY created_at DESC`;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Get posts from followed artists
router.get('/feed/artists', authenticate, (req, res, next) => {
  const sql = `
    SELECT board_posts.*, users.username, users.name, users.avatar_id, users.is_artist,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = 1) AS likes,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = -1) AS dislikes,
      (SELECT COUNT(*) FROM board_comments WHERE post_id = board_posts.id) AS comments
    FROM board_posts
    JOIN users ON board_posts.user_id = users.id
    JOIN follows ON follows.followed_id = board_posts.user_id
    WHERE follows.follower_id = ? AND users.is_artist = 1
    ORDER BY created_at DESC`;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Get posts from followed non-artist friends
router.get('/feed/friends', authenticate, (req, res, next) => {
  const sql = `
    SELECT board_posts.*, users.username, users.name, users.avatar_id, users.is_artist,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = 1) AS likes,
      (SELECT COUNT(*) FROM board_reactions WHERE post_id = board_posts.id AND reaction = -1) AS dislikes,
      (SELECT COUNT(*) FROM board_comments WHERE post_id = board_posts.id) AS comments
    FROM board_posts
    JOIN users ON board_posts.user_id = users.id
    JOIN follows ON follows.followed_id = board_posts.user_id
    WHERE follows.follower_id = ? AND users.is_artist = 0
    ORDER BY created_at DESC`;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Create a board post
router.post(
  '/',
  authenticate,
  body('headline').trim().notEmpty().escape(),
  body('content').trim().notEmpty().escape(),
  validate,
  (req, res, next) => {
    const { headline, content } = req.body;
    db.run(
      'INSERT INTO board_posts(user_id, headline, content) VALUES(?, ?, ?)',
      [req.user.id, headline, content],
      function (err) {
        if (err) return next(err);
        addPoints(req.user.id, 5, req.user.is_artist);
        awardBadge(req.user.id, 'First Post', req.user.is_artist);
        res.json({ id: this.lastID, user_id: req.user.id, headline, content });
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
    db.get('SELECT user_id FROM board_posts WHERE id = ?', [req.params.id], (e, row) => {
      if (!e && row && row.user_id !== req.user.id) {
        notify(row.user_id, `User ${req.user.id} liked your post`);
      }
    });
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
    db.get('SELECT user_id FROM board_posts WHERE id = ?', [req.params.id], (e, row) => {
      if (!e && row && row.user_id !== req.user.id) {
        notify(row.user_id, `User ${req.user.id} disliked your post`);
      }
    });
    res.json({ success: true });
  });
});

// Get comments for a post
router.get('/:id/comments', param('id').isInt(), validate, (req, res, next) => {
  const sql = `SELECT board_comments.*, users.username, users.name, users.avatar_id, users.is_artist FROM board_comments
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
  body('content').trim().notEmpty().escape(),
  validate,
  (req, res, next) => {
    const { content } = req.body;
    const sql = `INSERT INTO board_comments(post_id, user_id, content) VALUES(?, ?, ?)`;
    db.run(sql, [req.params.id, req.user.id, content], function (err) {
      if (err) return next(err);
      db.get('SELECT user_id FROM board_posts WHERE id = ?', [req.params.id], (e, row) => {
        if (!e && row && row.user_id !== req.user.id) {
          notify(row.user_id, `User ${req.user.id} commented on your post`);
        }
      });
      addPoints(req.user.id, 2, req.user.is_artist);
      res.json({ id: this.lastID, post_id: req.params.id, user_id: req.user.id, content });
    });
  }
);

// Update a board post
router.put(
  '/:id',
  authenticate,
  param('id').isInt(),
  body('headline').trim().notEmpty().escape(),
  body('content').trim().notEmpty().escape(),
  validate,
  (req, res, next) => {
    const { headline, content } = req.body;
    db.get('SELECT user_id FROM board_posts WHERE id = ?', [req.params.id], (err, row) => {
      if (err) return next(err);
      if (!row) {
        const nf = new Error('Post not found');
        nf.status = 404;
        return next(nf);
      }
      if (row.user_id !== req.user.id) {
        const no = new Error('Not allowed');
        no.status = 403;
        return next(no);
      }
      db.run('UPDATE board_posts SET headline = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [headline, content, req.params.id], err2 => {
        if (err2) return next(err2);
        res.json({ success: true });
      });
    });
  }
);

// Update a comment
router.put(
  '/comments/:id',
  authenticate,
  param('id').isInt(),
  body('content').trim().notEmpty().escape(),
  validate,
  (req, res, next) => {
    const { content } = req.body;
    db.get('SELECT user_id FROM board_comments WHERE id = ?', [req.params.id], (err, row) => {
      if (err) return next(err);
      if (!row) {
        const nf = new Error('Comment not found');
        nf.status = 404;
        return next(nf);
      }
      if (row.user_id !== req.user.id) {
        const no = new Error('Not allowed');
        no.status = 403;
        return next(no);
      }
      db.run(
        'UPDATE board_comments SET content = ? WHERE id = ?',
        [content, req.params.id],
        err2 => {
          if (err2) return next(err2);
          res.json({ success: true });
        }
      );
    });
  }
);

// Delete a comment
router.delete('/comments/:id', authenticate, param('id').isInt(), validate, (req, res, next) => {
  db.get('SELECT user_id FROM board_comments WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return next(err);
    if (!row) {
      const nf = new Error('Comment not found');
      nf.status = 404;
      return next(nf);
    }
    if (row.user_id !== req.user.id) {
      const no = new Error('Not allowed');
      no.status = 403;
      return next(no);
    }
    db.run('DELETE FROM board_comments WHERE id = ?', [req.params.id], err2 => {
      if (err2) return next(err2);
      res.json({ success: true });
    });
  });
});

// Delete a board post
router.delete('/:id', authenticate, param('id').isInt(), validate, (req, res, next) => {
  db.get('SELECT user_id FROM board_posts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return next(err);
    if (!row) {
      const nf = new Error('Post not found');
      nf.status = 404;
      return next(nf);
    }
    if (row.user_id !== req.user.id) {
      const no = new Error('Not allowed');
      no.status = 403;
      return next(no);
    }
    db.run('DELETE FROM board_posts WHERE id = ?', [req.params.id], err2 => {
      if (err2) return next(err2);
      res.json({ success: true });
    });
  });
});

module.exports = router;
