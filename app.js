const express = require('express');
const bodyParser = require('body-parser');
const { init } = require('./db');

const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');
const mediaRouter = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Initialize database
init();

app.use('/users', usersRouter);
app.use('/messages', messagesRouter);
app.use('/media', mediaRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the Unde the Radar API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
