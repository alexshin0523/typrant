var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  console.log('a user connected');
  players[socket.id]={
    /*
    x: Math.floor(Math.random() * 420 ) + 40,
    y: Math.floor(Math.random() * 420 ) + 40,
    */
    x: Math.floor(Math.random() * 100 ) + 40,
    y: Math.floor(Math.random() * 100 ) + 40,
    playerId: socket.id,
    mass: 50,
  };

  //send list of players to new player
  socket.emit('currentPlayers',players);
  //update current players with new player
  socket.broadcast.emit( 'newPlayer' , players[socket.id]);
  
  //handle if a user leaves the game
  socket.on('disconnect', function(){
    console.log('user disconnect');
    delete players[socket.id];
    io.emit('disconnect',socket.id);
  });

  socket.on('playerMovement', function( movementData){
    players[socket.id].x=movementData.x;
    players[socket.id].y=movementData.y;
    socket.broadcast.emit('playerMoved',players[socket.id]);
  });

  socket.on('p2pHit', function( playerId , otherPlayerId ){
    let text = "we fighting";
    socket.broadcast.to(otherPlayerId).emit('p2pBattle', text );
    socket.emit( 'p2pBattle',text);
  });

});


server.listen(8081, function () {
    console.log(`Listening on ${server.address().port}`);
});
