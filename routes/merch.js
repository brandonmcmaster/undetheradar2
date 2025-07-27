const express = require('express');
const router = express.Router();
const { db } = require('../db');
const authenticate = require('../middleware/auth');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

// List all merch items
router.get('/', (req, res, next) => {
  db.all('SELECT * FROM merch', [], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Get merch for a specific user
router.get('/user/:id', param('id').isInt(), validate, (req, res, next) => {
  db.all('SELECT * FROM merch WHERE user_id = ?', [req.params.id], (err, rows) => {
    if (err) return next(err);
    res.json(rows);
  });
});

// Create a merch item
router.post(
  '/',
  authenticate,
  body('product_name').trim().notEmpty(),
  body('price').isFloat(),
  body('stock').optional().isInt(),
  validate,
  (req, res, next) => {
    const { product_name, price, stock = 0 } = req.body;
    db.run(
      'INSERT INTO merch(user_id, product_name, price, stock) VALUES(?,?,?,?)',
      [req.user.id, product_name, price, stock],
      function (err) {
        if (err) return next(err);
        res.json({ id: this.lastID });
      }
    );
  }
);

module.exports = router;
