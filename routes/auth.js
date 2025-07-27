const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Register a new user
router.post(
  '/register',
  body('name').trim().notEmpty().escape(),
  body('username').trim().notEmpty().escape(),
  body('password').notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('bio').optional().escape(),
  body('social').optional().escape(),
  body('is_artist').optional().isBoolean().toBoolean(),
  validate,
  (req, res, next) => {
    const { name, username, password, email, bio, social, is_artist } = req.body;
    const hashed = bcrypt.hashSync(password, 10);
    const stmt =
      'INSERT INTO users(name, username, password, email, bio, social, is_artist) VALUES(?,?,?,?,?,?,?)';
    db.run(
      stmt,
      [name, username, hashed, email, bio, social, is_artist ? 1 : 0],
      function (err) {
        if (err) return next(err);
        const token = jwt.sign({ id: this.lastID, username }, SECRET);
        res.json({ token, id: this.lastID });
      }
    );
  }
);

// Login existing user
router.post(
  '/login',
  body('username').trim().notEmpty().escape(),
  body('password').notEmpty(),
  validate,
  (req, res, next) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) return next(err);
      if (!user) return next(new Error('Invalid credentials'));
      if (!bcrypt.compareSync(password, user.password)) {
        return next(new Error('Invalid credentials'));
      }
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
      res.json({ token, id: user.id });
    });
  }
);

module.exports = router;
