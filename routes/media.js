const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const authenticate = require('../middleware/auth');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// List uploaded files
router.get('/', (req, res) => {
  db.all('SELECT * FROM media', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Upload a new file
router.post('/', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });
  db.run('INSERT INTO media(file_name) VALUES(?)', [req.file.filename], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, file: req.file.filename });
  });
});

module.exports = router;
