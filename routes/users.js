const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');

// Get all users
router.get('/', (req, res) => {
  db.all('SELECT id, name, username, email, bio, social FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update current user's profile
router.post('/', authenticate, (req, res) => {
  const { name, email, bio, social } = req.body;
  db.run(
    'UPDATE users SET name = ?, email = ?, bio = ?, social = ? WHERE id = ?',
    [name, email, bio, social, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Get a user by ID
router.get('/:id', (req, res) => {
  db.get('SELECT id, name, username, email, bio, social FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

module.exports = router;
