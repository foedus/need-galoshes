//
// Setup dependecies
//
var express = require('express');
var app = express.createServer();

var server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , stylus = require('stylus')
  , nib = require('nib')
  , jade = require('jade');

//
// Configure basic app settings, using stylus/jade/nib to render
//
app.set('view engine','jade');
app.configure(function () {
  app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname);
  app.set('view engine', 'jade');

  function compile (str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib());
  };
});

//
//Setup Routing
//

app.get('/', function (req, res) {
  res.render('index', { layout: false });
});

//
//Start the app server
//

app.listen(3000, function () {
  //var addr = app.address();
  console.log('   app listening on http://localhost:3000');
});

//
//Launch Socket.io
//

//var io = sio.listen(app)
  var nicknames = {};

io.sockets.on('connection', function (socket) {
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function (nick, fn) {
    if (nicknames[nick]) {
      fn(true);
    } else {
      fn(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});