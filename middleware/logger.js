const crypto = require('crypto');
const logger = require('../logger');
const metrics = require('../metrics');

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  req.id = crypto.randomBytes(6).toString('hex');
  metrics.recordRequest();
  res.on('finish', () => {
    const dur = Number(process.hrtime.bigint() - start) / 1e6;
    metrics.recordResponseTime(dur);
    logger.info({
      reqId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: dur.toFixed(2)
    });
  });
  next();
};
