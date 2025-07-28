const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/', authenticate, (req, res, next) => {
  db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

router.get('/unread_count', authenticate, (req, res, next) => {
  db.get(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id],
    (err, row) => {
      if (err) return next(err);
      res.json({ count: row.count });
    }
  );
});

router.post('/:id/read', authenticate, param('id').isInt(), validate, (req, res, next) => {
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) return next(err);
      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
