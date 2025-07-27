const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// Get all messages
router.get('/', (req, res, next) => {
  db.all('SELECT * FROM messages', [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Create a new message
router.post(
  '/',
  authenticate,
  body('receiver_id').isInt(),
  body('content').trim().notEmpty(),
  validate,
  (req, res, next) => {
    const { receiver_id, content } = req.body;
    db.run(
      'INSERT INTO messages(sender_id, receiver_id, content) VALUES(?, ?, ?)',
      [req.user.id, receiver_id, content],
      function (err) {
        if (err) return next(err);
        res.json({
          id: this.lastID,
          sender_id: req.user.id,
          receiver_id,
          content
        });
      }
    );
  }
);

module.exports = router;
