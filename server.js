var path = require('path'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    socketio = require('socket.io'),
    io = socketio.listen(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req,res) {
    res.sendfile('index.html');
});


// SOCKET SHIET
var players = {};

io.on('connection', function(socket) {

	socket.on('gameReady', function(data) {

		// called when a new player joins
		socket.sessionId = data.id;
		var newPlayer = {id: data.id, pos: {x: 128, y: 328}};
		// socket.emit('addOldPlayers', players); // add other players to new screen
		// socket.broadcast.emit('addNewPlayer', newPlayer); // add new player to other screens
		socket.emit('addMainPlayer', newPlayer);
		players[data.id] = newPlayer;
	});
});


// LOLWUT?
server.listen(4000);
console.log('AH-PDA LISTENING ON 4000...');