const logger = require('../logger');
const metrics = require('../metrics');

module.exports = (err, req, res, next) => {
  logger.error({ err, reqId: req.id });
  metrics.recordError();
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const response = { error: message };
  if (err.details) response.details = err.details;
  res.status(status).json(response);
};
