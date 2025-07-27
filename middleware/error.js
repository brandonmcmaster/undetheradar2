module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const response = { error: message };
  if (err.details) response.details = err.details;
  res.status(status).json(response);
};
