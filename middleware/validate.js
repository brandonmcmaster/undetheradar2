const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation error');
    err.status = 400;
    err.details = errors.array();
    return next(err);
  }
  next();
};
