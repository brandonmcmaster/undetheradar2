const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// Get all users
router.get('/', (req, res) => {
  db.all('SELECT id, name, username, email, bio, social FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update current user's profile
router.post(
  '/',
  authenticate,
  body('name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('bio').optional(),
  body('social').optional(),
  validate,
  (req, res, next) => {
    const { name, email, bio, social } = req.body;
    db.run(
      'UPDATE users SET name = ?, email = ?, bio = ?, social = ? WHERE id = ?',
      [name, email, bio, social, req.user.id],
      function (err) {
        if (err) return next(err);
        res.json({ updated: this.changes });
      }
    );
  }
);

// Get a user by ID
router.get(
  '/:id',
  param('id').isInt(),
  validate,
  (req, res, next) => {
    db.get(
      'SELECT id, name, username, email, bio, social FROM users WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) return next(err);
        if (!row) return next(new Error('User not found'));
        res.json(row);
      }
    );
  }
);

module.exports = router;
