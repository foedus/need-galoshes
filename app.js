//
// Setup dependecies
//

var express = require('express')
  , http = require('http').createServer(app)
  , io = require('socket.io').listen(server);

//
//Start the app server
//

var app = express();
var server = http.createServer(app);

server.listen(8080);


//
// Configure basic app settings, using stylus/jade/nib to render
//
app.set('title','Galosh-Chat')
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
//Launch Socket.io
//

var sio = io.listen(app)
  , nicknames = {};

sio.sockets.on('connection', function (socket) {
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