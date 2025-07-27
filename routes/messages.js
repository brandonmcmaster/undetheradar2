const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Get all messages
router.get('/', (req, res) => {
  db.all('SELECT * FROM messages', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create a new message
router.post('/', (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  if (!sender_id || !receiver_id || !content) {
    return res.status(400).json({ error: 'sender_id, receiver_id and content are required' });
  }
  db.run('INSERT INTO messages(sender_id, receiver_id, content) VALUES(?, ?, ?)', [sender_id, receiver_id, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, sender_id, receiver_id, content });
  });
});

module.exports = router;
