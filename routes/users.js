const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const uploadDir = path.join(__dirname, '..', 'uploads');
const imageTypes = ['image/jpeg', 'image/png'];
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, unique + path.extname(sanitized));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (imageTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid MIME type'));
  }
});

// Get all users
router.get('/', (req, res) => {
  let sql =
    'SELECT id, name, username, email, bio, social, avatar_id, is_artist, fan_points, artist_points FROM users';
  const params = [];
  const { type, q, letter } = req.query;
  const conditions = [];
  if (type === 'artist') {
    conditions.push('is_artist = 1');
  } else if (type === 'user') {
    conditions.push('is_artist = 0');
  }
  if (q) {
    conditions.push('(name LIKE ? COLLATE NOCASE OR username LIKE ? COLLATE NOCASE)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (letter) {
    conditions.push('(name LIKE ? COLLATE NOCASE OR username LIKE ? COLLATE NOCASE)');
    params.push(`${letter}%`, `${letter}%`);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update current user's profile
router.post(
  '/',
  authenticate,
  body('name').optional().notEmpty().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('bio').optional().escape(),
  body('social').optional().escape(),
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

// Upload avatar image for current user
router.post('/avatar', authenticate, upload.single('avatar'), (req, res, next) => {
  if (!req.file) {
    const errFile = new Error('File is required');
    errFile.status = 400;
    return next(errFile);
  }
  const filePath = path.join(uploadDir, req.file.filename);
  exec(`clamscan ${filePath}`, (err, stdout) => {
    if (err && err.code === 127) {
      // clamscan not installed, skip scanning
    } else if (err && err.code !== 1 && err.code !== 2) {
      return next(new Error('Virus scan failed'));
    }
    if (stdout && stdout.includes('FOUND')) {
      fs.unlinkSync(filePath);
      const infected = new Error('Infected file');
      infected.status = 400;
      return next(infected);
    }
    db.run(
      'INSERT INTO media(file_name, original_name, mime_type, size, user_id) VALUES(?,?,?,?,?)',
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.user.id],
      function(err2) {
        if (err2) return next(err2);
        const mediaId = this.lastID;
        db.run('UPDATE users SET avatar_id = ? WHERE id = ?', [mediaId, req.user.id], function(err3) {
          if (err3) return next(err3);
          res.json({ avatar_id: mediaId });
        });
      }
    );
  });
});

// Get a user by ID
router.get(
  '/:id',
  param('id').isInt(),
  validate,
  (req, res, next) => {
    db.get(
      'SELECT id, name, username, email, bio, social, avatar_id, is_artist, fan_points, artist_points FROM users WHERE id = ?',
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
