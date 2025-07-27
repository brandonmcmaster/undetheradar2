require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { init } = require('./db');
const logger = require('./logger');
const requestLogger = require('./middleware/logger');
const metrics = require('./metrics');

const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');
const mediaRouter = require('./routes/media');
const authRouter = require('./routes/auth');
const showsRouter = require('./routes/shows');
const merchRouter = require('./routes/merch');
const boardRouter = require('./routes/board');
const errorHandler = require('./middleware/error');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./openapi.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    }
  }
}));
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
}
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 60) * 1000,
  max: process.env.RATE_LIMIT_MAX || 100
});
app.use(limiter);

app.use(bodyParser.json());
app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Initialize database
init();

app.use('/users', usersRouter);
app.use('/messages', messagesRouter);
app.use('/media', mediaRouter);
app.use('/auth', authRouter);
app.use('/shows', showsRouter);
app.use('/merch', merchRouter);
app.use('/board', boardRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(errorHandler);


if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
