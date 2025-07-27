const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  totalResponseTime: 0
};

function recordRequest() {
  metrics.totalRequests += 1;
}

function recordResponseTime(ms) {
  metrics.totalResponseTime += ms;
}

function recordError() {
  metrics.totalErrors += 1;
}

function getMetrics() {
  const avg = metrics.totalRequests
    ? metrics.totalResponseTime / metrics.totalRequests
    : 0;
  return {
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    avgResponseTime: Number(avg.toFixed(2))
  };
}

module.exports = {
  recordRequest,
  recordResponseTime,
  recordError,
  getMetrics
};
