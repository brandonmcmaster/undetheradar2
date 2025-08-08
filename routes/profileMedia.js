const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { addPoints, awardBadge } = require('../utils/gamify');

const uploadDir = path.join(__dirname, '..', 'uploads');
const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];

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
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid MIME type'));
  }
});

// List profile media for a user
router.get('/user/:id', param('id').isInt(), validate, (req, res, next) => {
  db.all(
    `SELECT media.* FROM profile_media JOIN media ON profile_media.media_id = media.id WHERE profile_media.user_id = ? ORDER BY profile_media.created_at DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) return next(err);
      res.json(rows);
    }
  );
});

// Upload a picture or video to the authenticated user's profile
router.post('/', authenticate, upload.single('file'), (req, res, next) => {
  if (!req.file) {
    const errFile = new Error('File is required');
    errFile.status = 400;
    return next(errFile);
  }

  const filePath = path.join(uploadDir, req.file.filename);
  execFile('clamscan', [filePath], (err, stdout) => {
    if (err && err.code === 127) {
      // clamscan not installed
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
      function (err2) {
        if (err2) return next(err2);
        const mediaId = this.lastID;
        db.run(
          'INSERT INTO profile_media(user_id, media_id) VALUES(?,?)',
          [req.user.id, mediaId],
          function (err3) {
            if (err3) return next(err3);
            addPoints(req.user.id, 5, req.user.is_artist);
            awardBadge(req.user.id, 'Debut Release', req.user.is_artist);
            res.json({ id: this.lastID, media_id: mediaId });
          }
        );
      }
    );
  });
});

module.exports = router;
