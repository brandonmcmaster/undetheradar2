const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const notify = require('../utils/notify');

router.get('/followers/:id', param('id').isInt(), validate, (req, res, next) => {
  db.all('SELECT follower_id FROM follows WHERE followed_id = ?', [req.params.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

router.get('/following/:id', param('id').isInt(), validate, (req, res, next) => {
  db.all('SELECT followed_id FROM follows WHERE follower_id = ?', [req.params.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

router.get('/:id', authenticate, param('id').isInt(), validate, (req, res, next) => {
  db.get(
    'SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?',
    [req.user.id, req.params.id],
    (err, row) => {
      if (err) return next(err);
      res.json({ following: !!row });
    }
  );
});

router.post('/:id', authenticate, param('id').isInt(), validate, (req, res, next) => {
  if (Number(req.params.id) === req.user.id) {
    const err = new Error('Cannot follow yourself');
    err.status = 400;
    return next(err);
  }
  db.run(
    'INSERT OR IGNORE INTO follows(follower_id, followed_id) VALUES(?, ?)',
    [req.user.id, req.params.id],
    function (err) {
      if (err) return next(err);
      if (this.changes) notify(req.params.id, `User ${req.user.id} followed you`);
      res.json({ followed: this.changes > 0 });
    }
  );
});

router.delete('/:id', authenticate, param('id').isInt(), validate, (req, res, next) => {
  db.run(
    'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
    [req.user.id, req.params.id],
    function (err) {
      if (err) return next(err);
      res.json({ unfollowed: this.changes > 0 });
    }
  );
});

module.exports = router;
