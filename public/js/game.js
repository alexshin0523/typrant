var BootScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BootScene(){
    Phaser.Scene.call(this,{key:'BootScene'});
  },

  preload: function(){
    this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });

    //get map from some place
    this.load.image('tiles', 'assets/map/spritesheet.png');
    this.load.tilemapTiledJSON('map', 'assets/map/map.json');

  },

  create: function(){
    this.scene.start('MenuScene');
  },
});

var MenuScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function MenuScene(){
    Phaser.Scene.call(this,{key:'MenuScene'});
  },

  create: function(){
    var TitleTxt = this.add.text(100,50,'Menu Scene');
    var AdvanceTxt = this.add.text(100,150,'Advance');
    AdvanceTxt.setInteractive();
    AdvanceTxt.on(
      'pointerdown', 
      function()
        {
          this.scene.start('RoamScene');
        }, 
      this
    );
  },
});

var RoamScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function RoamScene(){
    Phaser.Scene.call(this,{key:'RoamScene'});
  },

  create: function(){
    //socket code 
    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.player = this.physics.add.sprite( 50 , 50 ,'player', 6);

    //at the beginning
    this.socket.on('currentPlayers',function(players){
      Object.keys(players).forEach((id)=>{
        //add self
        if(players[id].playerId === self.socket.id){
          //self.player = self.physics.add.sprite( players[id].x , players[id].y ,'player', 6);
          self.player.setPosition( players[id].x , players[id].y);
          self.player.setCollideWorldBounds(true);
          self.cameras.main.startFollow(self.player);
        }
        else{ //add others
          addOtherPlayers( self, players[id]);
        }
      });
    });

    //durring game player adding
    this.socket.on('newPlayer', (playerInfo)=>{
          addOtherPlayers( self, playerInfo);
    });

    //remove players
    this.socket.on('disconnect',(playerId)=>{
      self.otherPlayers.getChildren().forEach(function (otherPlayers) {
        if (playerId === otherPlayers.playerId) {
          otherPlayers.destroy();
        }
      });
    });

    //move players
    this.socket.on('playerMoved', function(playerInfo){
      self.otherPlayers.getChildren().forEach( function(otherPlayer){
        if( playerInfo.playerId === otherPlayer.playerId ){
          otherPlayer.setPosition( playerInfo.x, playerInfo.y);
        }
      });
    });

    

    this.socket.on('p2pBattle', function( text ){
      console.log(text);
      self.scene.start( 'TypeScene' );
    });

    //map things
    var map = this.make.tilemap({key:'map'});
    var tiles = map.addTilesetImage('spritesheet', 'tiles');
    var grass = map.createStaticLayer('Grass', tiles, 0, 0);
    var obstacles = map.createStaticLayer('Obstacles', tiles, 0, 0);
    obstacles.setCollisionByExclusion([-1]);

    //camera things
    this.physics.world.bounds.width = map.widthInPixels; //480
    this.physics.world.bounds.height = map.heightInPixels;//480
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0,0,map.widthInPixels, map.heightInPixels);
    
    //cursor things
    this.cursors = this.input.keyboard.createCursorKeys();

    //colision things
   this.physics.add.collider(this.player,obstacles);
    this.physics.add.overlap(this.player,this.otherPlayers, this.p2p ,null,this);

  },

  p2p : function( player , otherPlayer ){
    this.socket.emit( 'p2pHit', this.socket.id , otherPlayer.playerId);
  },

  update: function (time, delta){
    if(this.player){

      var x=this.player.x;
      var y=this.player.y;

      if(this.player.oldPosition && (x!==this.player.oldPosition.x || y!==this.player.oldPosition.y)){
        this.socket.emit('playerMovement',{x:this.player.x,y:this.player.y});
      }

      this.player.oldPosition={
        x:this.player.x,
        y:this.player.y,
      };

      this.player.body.setVelocity(0);

      // Horizontal movement
      if (this.cursors.left.isDown){
        this.player.body.setVelocityX(-80);
      }
      else if (this.cursors.right.isDown){
        this.player.body.setVelocityX(80);
      }

      // Vertical movement
      if (this.cursors.up.isDown){
        this.player.body.setVelocityY(-80);
      }
      else if (this.cursors.down.isDown){
        this.player.body.setVelocityY(80);
      }    
    }
  },

});

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite( playerInfo.x , playerInfo.y ,'player', 3);
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

var TypeScene= new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function TypeScene(){
    Phaser.Scene.call(this,{key:'TypeScene'});
  },

  create: function(){
    var TitleTxt = this.add.text(100,50,'Type Scene');
  }
});

var config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 320,
  height: 240,
  zoom: 2,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scene: [ BootScene ,  MenuScene, RoamScene , TypeScene]
};

var game = new Phaser.Game(config);
