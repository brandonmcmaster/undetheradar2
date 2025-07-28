const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const notify = require('../utils/notify');

// Get authenticated user's inbox
router.get('/inbox', authenticate, (req, res, next) => {
  db.all(
    'SELECT * FROM messages WHERE receiver_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

// Get authenticated user's outbox
router.get('/outbox', authenticate, (req, res, next) => {
  db.all(
    'SELECT * FROM messages WHERE sender_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

// Create a new message
router.post(
  '/',
  authenticate,
  body('receiver_id').isInt(),
  body('content').trim().notEmpty().escape(),
  validate,
  (req, res, next) => {
    const { receiver_id, content } = req.body;
    db.get('SELECT id FROM users WHERE id = ?', [receiver_id], (err, user) => {
      if (err) return next(err);
      if (!user) {
        const nf = new Error('Receiver not found');
        nf.status = 400;
        return next(nf);
      }

      db.run(
        'INSERT INTO messages(sender_id, receiver_id, content) VALUES(?, ?, ?)',
        [req.user.id, receiver_id, content],
        function (err2) {
          if (err2) return next(err2);
          if (receiver_id !== req.user.id) {
            notify(receiver_id, `User ${req.user.id} sent you a message`);
          }
          res.json({
            id: this.lastID,
            sender_id: req.user.id,
            receiver_id,
            content
          });
        }
      );
    });
  }
);

module.exports = router;
