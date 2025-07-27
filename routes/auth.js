const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'secret';

// Register a new user
router.post('/register', (req, res) => {
  const { name, username, password, email, bio, social } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'name, username and password required' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const stmt = `INSERT INTO users(name, username, password, email, bio, social) VALUES(?,?,?,?,?,?)`;
  db.run(stmt, [name, username, hashed, email, bio, social], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const token = jwt.sign({ id: this.lastID, username }, SECRET);
    res.json({ token, id: this.lastID });
  });
});

// Login existing user
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
    res.json({ token, id: user.id });
  });
});

module.exports = router;
