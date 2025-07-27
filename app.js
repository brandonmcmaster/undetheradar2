const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { init } = require('./db');

const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');
const mediaRouter = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
init();

app.use('/users', usersRouter);
app.use('/messages', messagesRouter);
app.use('/media', mediaRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
