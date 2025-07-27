const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { init } = require('./db');

const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');
const mediaRouter = require('./routes/media');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
