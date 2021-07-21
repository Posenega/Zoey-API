const fs = require('fs');
const path = require('path');
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const HttpError = require('./models/http-error');
const bookRoutes = require('./routes/book-routes');
const usersRoutes = require('./routes/users-routes');
const conversationRoute = require('./routes/conversations');
const messageRoute = require('./routes/messages');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

mongoose.set('useCreateIndex', true);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  '/uploads/images',
  express.static(path.join('uploads', 'images'))
);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-Width, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE'
  );
  next();
});

app.use('/api/books', bookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationRoute);
app.use('/api/messages', messageRoute);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({
    message: error.message || 'An unknown error occurred!',
  });
});

io.on('connection', (socket) => {
  // console.log("a user connected :D");
  socket.on('chat message', (msg) => {
    console.log(msg);
    io.emit('chat message', msg);
  });
});

mongoose
  .connect(
    'mongodb://localhost:27017/book-app',
    // `mongodb://${process.env.CONNECTION_NAME}:27017,${process.env.CONNECTION_NAME}:27018,${process.env.CONNECTION_NAME}:27019/book-app?replicaSet=rs`,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }
  )
  .then(() => {
    server.listen(process.env.PORT || 5000);
    console.log('server running');
  })
  .catch((err) => {
    console.log(err);
  });
