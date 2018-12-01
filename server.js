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
  //HELP PLS TEAM
  //HELP PLS TEAM
  //HELP PLS TEAM
  //HELP PLS TEAM
  //HELP PLS TEAM
  players[socket.id]={
    x: Math.floor(Math.random() * 420 ) + 40,
    y: Math.floor(Math.random() * 420 ) + 40,
    /*
    x: Math.floor(Math.random() * 100 ) + 40,
    y: Math.floor(Math.random() * 100 ) + 40,
    */
    playerId: socket.id,
    mass: 50,
    inBattle: false,
    username: 'I will connect later',
    //^^^you might want to make this the socket.id in the mean time
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
    players[playerId].inBattle = true;
    players[otherPlayerId].inBattle = true;
    socket.broadcast.emit('playerBattle',players[socket.id]);
    //change to io.emit
    socket.broadcast.emit('playerBattle',players[otherPlayerId]);
    socket.broadcast.to(otherPlayerId).emit('p2pBattle', playerId );
    socket.emit( 'p2pBattle', otherPlayerId);
  });

  socket.on('typeSceneEnd', function( playerId , otherPlayerId ){
    socket.broadcast.to(otherPlayerId).emit('lose' );
    players[playerId].inBattle = false;
    players[otherPlayerId].inBattle = false;
    socket.broadcast.emit('playerBattle',players[socket.id]);
    io.emit('playerBattle',players[otherPlayerId]);

    //include mass after
    socket.broadcast.to(otherPlayerId).emit('battleOutCome' );
    socket.emit( 'battleOutCome' );

    let loserMass = players[otherPlayerId].mass;
    let winnerMass = players[playerId].mass;
    if( loserMass > winnerMass ){
      loserMass -= winnerMass;
      winnerMass += winnerMass;
    }
    else{
      winnerMass += loserMass ;
      loserMass = 1;
    }

    players[playerId].mass= winnerMass;
    players[otherPlayerId].mass= loserMass;

    io.emit('massUpdate', players[playerId] );
    io.emit('massUpdate', players[otherPlayerId] );
  });
    

});


server.listen(8081, function () {
    console.log(`Listening on ${server.address().port}`);
});
