const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validate');

const uploadDir = path.join(__dirname, '..', 'uploads');
const allowedTypes = ['image/jpeg', 'image/png', 'audio/mpeg', 'video/mp4'];

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
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid MIME type'));
    }
  }
});

// List uploaded files
router.get('/', (req, res, next) => {
  db.all('SELECT * FROM media', [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Upload a new file
router.post('/', authenticate, upload.single('file'), (req, res, next) => {
  if (!req.file) {
    const errFile = new Error('File is required');
    errFile.status = 400;
    return next(errFile);
  }

  const filePath = path.join(uploadDir, req.file.filename);
  // Virus scan using clamscan if available
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
      `INSERT INTO media(file_name, original_name, mime_type, size, user_id) VALUES(?,?,?,?,?)`,
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.user.id],
      function(err2) {
        if (err2) return next(err2);
        res.json({ id: this.lastID, file: req.file.filename });
      }
    );
  });
});

// Stream or download a file by id
router.get(
  '/:id',
  param('id').isInt(),
  validate,
  (req, res, next) => {
    db.get('SELECT file_name, mime_type FROM media WHERE id = ?', [req.params.id], (err, row) => {
      if (err) return next(err);
      if (!row) {
        const nf = new Error('Not found');
        nf.status = 404;
        return next(nf);
      }

    const filePath = path.join(uploadDir, path.basename(row.file_name));
    if (!fs.existsSync(filePath)) {
      const errFile = new Error('File missing');
      errFile.status = 404;
      return next(errFile);
    }

    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    const mime = row.mime_type || 'application/octet-stream';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': mime
      });
      fs.createReadStream(filePath).pipe(res);
    }
    });
  }
);

module.exports = router;
