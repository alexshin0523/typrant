var name = "Anonymous";
var playersList = [];


var BootScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BootScene(){
    App42.initialize("7ca44b1e251629507e13add0f304381d2fde6139b541b15d2e6b4c0f9cff5f5c","e924e9e4a8aebfb33eaee371157a61d95d067b0fc26fa42a49bb4244dee2ead0");
    scoreBoardService = new App42ScoreBoard()
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
    document.getElementById("promptBox").style.visibility = "hidden";

    var style = { font: "12px Arial", fill: "#ffffff", align: "center" };
    var TitleTxt = this.add.text(120,10,'Typrant',style);
    var InstructionTxt = this.add.text(120,100,'Instructions',style);
    // var InputTxt = this.add.text(120,125,'Enter Username',style);
    var AdvanceTxt = this.add.text(120,175,'Play',style);

    AdvanceTxt.setInteractive();
    AdvanceTxt.on(
      'pointerdown',
      function()
      {
        this.scene.start('RoamScene');
        document.getElementById("inputBox").style.visibility = "visible";
      },
      this
    );
    // InputTxt.setInteractive();
    // InputTxt.on(
    //   'pointerdown',
    //   function()
    //   {
    //     document.getElementById("inputBox").style.visibility = "visible";
    //     document.getElementById("userInput").placeholder = "Enter username";
    //
    //   },
    //   this
    // );
    InstructionTxt.setInteractive();
    InstructionTxt.on(
      'pointerdown',
      function()
      {
        this.scene.start('InstructionScene');
      },
      this
    );
  },
});



var InstructionScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function InstructionScene(){
    Phaser.Scene.call(this,{key:'InstructionScene'});
  },

  preload: function(){
    this.load.image('instructions', 'assets/TyprantInstructions.png');

  },

  create: function(){
    this.add.image(180,120,'instructions');
    var backTxt = this.add.text(10,10, 'Back');
    backTxt.setInteractive();
    backTxt.on(
      'pointerdown',
      function()
      {
        this.scene.start('MenuScene');
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

        if(players[id].playerId === self.socket.id){
          self.player.setPosition( players[id].x , players[id].y);
          self.player.setCollideWorldBounds(true);
          self.cameras.main.startFollow(self.player);
          self.player.mass = players[id].mass;
          self.player.inBattle = players[id].inBattle;
        }
        else{ //add others
          addOtherPlayers( self, players[id]);
        }
        playersList.push(players[id]);


        self.events.emit('refresh', playersList);
      });
      console.log(playersList.length);
      var index = playersList.length -1;
      console.log(playersList[index].username);

      document.getElementById("showUser").innerHTML= playersList[index].username;
    });

    //durring game player adding
    this.socket.on('newPlayer', (playerInfo)=>{
      addOtherPlayers( self, playerInfo);

      let players = [];
      players[0]=playerInfo;
      self.events.emit('refresh', players);


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
        console.log(playerInfo.username);
      });
    });

    //update battle status
    this.socket.on('playerBattle', function(playerInfo){
      self.otherPlayers.getChildren().forEach( function(otherPlayer){
        if( playerInfo.playerId === otherPlayer.playerId ){
          otherPlayer.inBattle = playerInfo.inBattle ;
        }
      });
    });

    //update mass
    this.socket.on('massUpdate', function(playerInfo){
      self.otherPlayers.getChildren().forEach( function(otherPlayer){
        if( playerInfo.playerId === otherPlayer.playerId ){
          otherPlayer.mass= playerInfo.mass;
        }

        let players = [];
        players[0]=playerInfo;
        console.log('massupdate');
        self.events.emit('refresh', players);

      });
    });

    this.socket.on('refesh',function (){

      self.events.emit('refresh', playerList);

    });

    this.socket.on('p2pBattle', function( otherId ){
      self.cameras.main.shake( 300 );
      self.player.inBattle = true;
      self.scene.launch( 'TypeScene' );
      self.otherId = otherId ;
    });

    this.socket.on('lose',function(){
      console.log( self.player.mass );
      q=0;
      self.cameras.main.shake( 300 );
      self.player.x = Math.floor(Math.random() * 420 ) + 40;
      self.player.y = Math.floor(Math.random() * 420 ) + 40;
      self.socket.emit('playerMovement',{x:self.player.x,y:self.player.y});
      document.getElementById('tester').innerHTML=" " ;
      document.getElementById("promptBox").style.visibility = "hidden";
      self.scene.stop('TypeScene');
    });

    //include mass
    this.socket.on('battleOutCome',function(){
      self.player.inBattle = false ;
    });

    let battleListener = this.scene.get('TypeScene');
    battleListener.events.on('battleEnd', function(players){
      console.log('battle end');
      self.socket.emit( 'typeSceneEnd' , self.socket.id, self.otherId );
      self.cameras.main.shake( 300 );
      self.player.x = Math.floor(Math.random() * 420 ) + 40;
      self.player.y = Math.floor(Math.random() * 420 ) + 40;
      self.socket.emit('playerMovement',{x:self.player.x,y:self.player.y});
      self.scene.stop( 'TypeScene');

      //self.events.emit('closeTypeScene');
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

    //HUDScene Launch
    this.scene.launch('HUDScene');


  },

  p2p : function( player , otherPlayer ){
    if( !this.player.inBattle && !otherPlayer.inBattle && otherPlayer.playerId != this.otherId ){
      console.log( this.player.inBattle);
      console.log( otherPlayer.inBattle);
      this.socket.emit( 'p2pHit', this.socket.id , otherPlayer.playerId);
    }
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
  otherPlayer.mass = playerInfo.mass;
  otherPlayer.inBattle = playerInfo.inBattle;
  self.otherPlayers.add(otherPlayer);
}

//HELP PLS TEAM
//HELP PLS TEAM
//HELP PLS TEAM
//HELP PLS TEAM
//HELP PLS TEAM
var HUDScene= new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function HUDScene (){
    Phaser.Scene.call(this,{key:'HUDScene'});
  },

  create: function(){
    let roamListener = this.scene.get('RoamScene');


    roamListener.events.on('refresh', function(players){

      Object.keys(players).forEach((id)=>{


        scoreBoardService.saveUserScore("Typrant4",players[id].username,players[id].mass,{
          success: function(object){
            var game = JSON.parse(object);
            result = game.app42.response.games.game;
            console.log("gameName is : " + result.name)
            var scoreList = result.scores.score;
            console.log("userName is : " + scoreList.userName)
            console.log("scoreId is : " + scoreList.scoreId)
            console.log("value is : " + scoreList.value)
          },
          error:function(error){
          }
        })

      });
      scoreBoardService.getTopNRankers("Typrant4", 10,{
        success: function(object)
        {
          var scorelist = "";
          var game = JSON.parse(object);
          result = game.app42.response.games.game;
          var scoreList = result.scores.score;
          if (scoreList instanceof Array) {
            for (var i = 0; i < scoreList.length; i++) {

              scorelist += "<tr><td align = \"left\">" + scoreList[i].userName + "</td><td align = \"right\">" + scoreList[i].value.toString() + "</td></tr>";

            }
          }
          document.getElementById("leaderboard").innerHTML = "<table width = \"100%\"><tr><td colspan = \"2\"><strong>Leaderboard</strong></td>"+scorelist+"</table>";
        },
        error: function(error) {
        }
      });
    });
  },
});

var TypeScene= new Phaser.Class({
  Extends: Phaser.Scene,


  initialize: function TypeScene(){
    Phaser.Scene.call(this,{key:'TypeScene'});

  },

  create: function(){

    passageArr = [];
    for(i = 0; i < 5; i++){
      passageArr.push(generateWords());
    }

    var self = this;
    //var TitleTxt = this.add.text(10,200,passageArr.join(' '),{backgroundColor:'#333'} );

    let roamListener = this.scene.get('RoamScene');
  },



  update: function(){
    document.getElementById("promptBox").style.visibility = "visible";

    if( (q < passageArr.length) ){
      document.getElementById('tester').innerHTML=passageArr[q] ;

      if( passageArr[q] == document.getElementById('userInput').value){
        ++q;

        document.getElementById('tester').innerHTML=passageArr[q] ;
        document.getElementById('userInput').value='' ;
      }
      else{

        document.getElementById('tester').innerHTML=passageArr[q] ;

      }

    }
    else{
      q=0;
      document.getElementById('tester').innerHTML=" " ;
      this.events.emit( 'battleEnd' );
      document.getElementById("promptBox").style.visibility = "hidden";

    }
  },
});

var q = 0;


var config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 360,
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
  scene: [ BootScene ,  MenuScene, RoamScene , HUDScene , TypeScene , InstructionScene]

};

var game = new Phaser.Game(config);



function generateWords(){
  var wordList = [
    // Borrowed from xkcd password generator which borrowed it from wherever
    "ability","able","aboard","about","above","accept","accident","according",
    "account","accurate","acres","across","act","action","active","activity",
    "actual","actually","add","addition","additional","adjective","adult","adventure",
    "advice","affect","afraid","after","afternoon","again","against","age",
    "ago","agree","ahead","aid","air","airplane","alike","alive",
    "all","allow","almost","alone","along","aloud","alphabet","already",
    "also","although","am","among","amount","ancient","angle","angry",
    "animal","announced","another","answer","ants","any","anybody","anyone",
    "anything","anyway","anywhere","apart","apartment","appearance","apple","applied",
    "appropriate","are","area","arm","army","around","arrange","arrangement",
    "arrive","arrow","art","article","as","aside","ask","asleep",
    "at","ate","atmosphere","atom","atomic","attached","attack","attempt",
    "attention","audience","author","automobile","available","average","avoid","aware",
    "away","baby","back","bad","badly","bag","balance","ball",
    "balloon","band","bank","bar","bare","bark","barn","base",
    "baseball","basic","basis","basket","bat","battle","be","bean",
    "bear","beat","beautiful","beauty","became","because","become","becoming",
    "bee","been","before","began","beginning","begun","behavior","behind",
    "being","believed","bell","belong","below","belt","bend","beneath",
    "bent","beside","best","bet","better","between","beyond","bicycle",
    "bigger","biggest","bill","birds","birth","birthday","bit","bite",
    "black","blank","blanket","blew","blind","block","blood","blow",
    "blue","board","boat","body","bone","book","border","born",
    "both","bottle","bottom","bound","bow","bowl","box","boy",
    "brain","branch","brass","brave","bread","break","breakfast","breath",
    "breathe","breathing","breeze","brick","bridge","brief","bright","bring",
    "broad","broke","broken","brother","brought","brown","brush","buffalo",
    "build","building","built","buried","burn","burst","bus","bush",
    "business","busy","but","butter","buy","by","cabin","cage",
    "cake","call","calm","came","camera","camp","can","canal",
    "cannot","cap","capital","captain","captured","car","carbon","card",
    "care","careful","carefully","carried","carry","case","cast","castle",
    "cat","catch","cattle","caught","cause","cave","cell","cent",
    "center","central","century","certain","certainly","chain","chair","chamber",
    "chance","change","changing","chapter","character","characteristic","charge","chart",
    "check","cheese","chemical","chest","chicken","chief","child","children",
    "choice","choose","chose","chosen","church","circle","circus","citizen",
    "city","class","classroom","claws","clay","clean","clear","clearly",
    "climate","climb","clock","close","closely","closer","cloth","clothes",
    "clothing","cloud","club","coach","coal","coast","coat","coffee",
    "cold","collect","college","colony","color","column","combination","combine",
    "come","comfortable","coming","command","common","community","company","compare",
    "compass","complete","completely","complex","composed","composition","compound","concerned",
    "condition","congress","connected","consider","consist","consonant","constantly","construction",
    "contain","continent","continued","contrast","control","conversation","cook","cookies",
    "cool","copper","copy","corn","corner","correct","correctly","cost",
    "cotton","could","count","country","couple","courage","course","court",
    "cover","cow","cowboy","crack","cream","create","creature","crew",
    "crop","cross","crowd","cry","cup","curious","current","curve",
    "customs","cut","cutting","daily","damage","dance","danger","dangerous",
    "dark","darkness","date","daughter","dawn","day","dead","deal",
    "dear","death","decide","declared","deep","deeply","deer","definition",
    "degree","depend","depth","describe","desert","design","desk","detail",
    "determine","develop","development","diagram","diameter","did","die","differ",
    "difference","different","difficult","difficulty","dig","dinner","direct","direction",
    "directly","dirt","dirty","disappear","discover","discovery","discuss","discussion",
    "disease","dish","distance","distant","divide","division","do","doctor",
    "does","dog","doing","doll","dollar","done","donkey","door",
    "dot","double","doubt","down","dozen","draw","drawn","dream",
    "dress","drew","dried","drink","drive","driven","driver","driving",
    "drop","dropped","drove","dry","duck","due","dug","dull",
    "during","dust","duty","each","eager","ear","earlier","early",
    "earn","earth","easier","easily","east","easy","eat","eaten",
    "edge","education","effect","effort","egg","eight","either","electric",
    "electricity","element","elephant","eleven","else","empty","end","enemy",
    "energy","engine","engineer","enjoy","enough","enter","entire","entirely",
    "environment","equal","equally","equator","equipment","escape","especially","essential",
    "establish","even","evening","event","eventually","ever","every","everybody",
    "everyone","everything","everywhere","evidence","exact","exactly","examine","example",
    "excellent","except","exchange","excited","excitement","exciting","exclaimed","exercise",
    "exist","expect","experience","experiment","explain","explanation","explore","express",
    "expression","extra","eye","face","facing","fact","factor","factory",
    "failed","fair","fairly","fall","fallen","familiar","family","famous",
    "far","farm","farmer","farther","fast","fastened","faster","fat",
    "father","favorite","fear","feathers","feature","fed","feed","feel",
    "feet","fell","fellow","felt","fence","few","fewer","field",
    "fierce","fifteen","fifth","fifty","fight","fighting","figure","fill",
    "film","final","finally","find","fine","finest","finger","finish",
    "fire","fireplace","firm","first","fish","five","fix","flag",
    "flame","flat","flew","flies","flight","floating","floor","flow",
    "flower","fly","fog","folks","follow","food","foot","football",
    "for","force","foreign","forest","forget","forgot","forgotten","form",
    "former","fort","forth","forty","forward","fought","found","four",
    "fourth","fox","frame","free","freedom","frequently","fresh","friend",
    "friendly","frighten","frog","from","front","frozen","fruit","fuel",
    "full","fully","fun","function","funny","fur","furniture","further",
    "future","gain","game","garage","garden","gas","gasoline","gate",
    "gather","gave","general","generally","gentle","gently","get","getting",
    "giant","gift","girl","give","given","giving","glad","glass",
    "globe","go","goes","gold","golden","gone","good","goose",
    "got","government","grabbed","grade","gradually","grain","grandfather","grandmother",
    "graph","grass","gravity","gray","great","greater","greatest","greatly",
    "green","grew","ground","group","grow","grown","growth","guard",
    "guess","guide","gulf","gun","habit","had","hair","half",
    "halfway","hall","hand","handle","handsome","hang","happen","happened",
    "happily","happy","harbor","hard","harder","hardly","has","hat",
    "have","having","hay","he","headed","heading","health","heard",
    "hearing","heart","heat","heavy","height","held","hello","help",
    "helpful","her","herd","here","herself","hidden","hide","high",
    "higher","highest","highway","hill","him","himself","his","history",
    "hit","hold","hole","hollow","home","honor","hope","horn",
    "horse","hospital","hot","hour","house","how","however","huge",
    "human","hundred","hung","hungry","hunt","hunter","hurried","hurry",
    "hurt","husband","ice","idea","identity","if","ill","image",
    "imagine","immediately","importance","important","impossible","improve","in","inch",
    "include","including","income","increase","indeed","independent","indicate","individual",
    "industrial","industry","influence","information","inside","instance","instant","instead",
    "instrument","interest","interior","into","introduced","invented","involved","iron",
    "is","island","it","its","itself","jack","jar","jet",
    "job","join","joined","journey","joy","judge","jump","jungle",
    "just","keep","kept","key","kids","kill","kind","kitchen",
    "knew","knife","know","knowledge","known","label","labor","lack",
    "lady","laid","lake","lamp","land","language","large","larger",
    "largest","last","late","later","laugh","law","lay","layers",
    "lead","leader","leaf","learn","least","leather","leave","leaving",
    "led","left","leg","length","lesson","let","letter","level",
    "library","lie","life","lift","light","like","likely","limited",
    "line","lion","lips","liquid","list","listen","little","live",
    "living","load","local","locate","location","log","lonely","long",
    "longer","look","loose","lose","loss","lost","lot","loud",
    "love","lovely","low","lower","luck","lucky","lunch","lungs",
    "lying","machine","machinery","mad","made","magic","magnet","mail",
    "main","mainly","major","make","making","man","managed","manner",
    "manufacturing","many","map","mark","market","married","mass","massage",
    "master","material","mathematics","matter","may","maybe","me","meal",
    "mean","means","meant","measure","meat","medicine","meet","melted",
    "member","memory","men","mental","merely","met","metal","method",
    "mice","middle","might","mighty","mile","military","milk","mill",
    "mind","mine","minerals","minute","mirror","missing","mission","mistake",
    "mix","mixture","model","modern","molecular","moment","money","monkey",
    "month","mood","moon","more","morning","most","mostly","mother",
    "motion","motor","mountain","mouse","mouth","move","movement","movie",
    "moving","mud","muscle","music","musical","must","my","myself",
    "mysterious","nails","name","nation","national","native","natural","naturally",
    "nature","near","nearby","nearer","nearest","nearly","necessary","neck",
    "needed","needle","needs","negative","neighbor","neighborhood","nervous","nest",
    "never","new","news","newspaper","next","nice","night","nine",
    "no","nobody","nodded","noise","none","noon","nor","north",
    "nose","not","note","noted","nothing","notice","noun","now",
    "number","numeral","nuts","object","observe","obtain","occasionally","occur",
    "ocean","of","off","offer","office","officer","official","oil",
    "old","older","oldest","on","once","one","only","onto",
    "open","operation","opinion","opportunity","opposite","or","orange","orbit",
    "order","ordinary","organization","organized","origin","original","other","ought",
    "our","ourselves","out","outer","outline","outside","over","own",
    "owner","oxygen","pack","package","page","paid","pain","paint",
    "pair","palace","pale","pan","paper","paragraph","parallel","parent",
    "park","part","particles","particular","particularly","partly","parts","party",
    "pass","passage","past","path","pattern","pay","peace","pen",
    "pencil","people","per","percent","perfect","perfectly","perhaps","period",
    "person","personal","pet","phrase","physical","piano","pick","picture",
    "pictured","pie","piece","pig","pile","pilot","pine","pink",
    "pipe","pitch","place","plain","plan","plane","planet","planned",
    "planning","plant","plastic","plate","plates","play","pleasant","please",
    "pleasure","plenty","plural","plus","pocket","poem","poet","poetry",
    "point","pole","police","policeman","political","pond","pony","pool",
    "poor","popular","population","porch","port","position","positive","possible",
    "possibly","post","pot","potatoes","pound","pour","powder","power",
    "powerful","practical","practice","prepare","present","president","press","pressure",
    "pretty","prevent","previous","price","pride","primitive","principal","principle",
    "printed","private","prize","probably","problem","process","produce","product",
    "production","program","progress","promised","proper","properly","property","protection",
    "proud","prove","provide","public","pull","pupil","pure","purple",
    "purpose","push","put","putting","quarter","queen","question","quick",
    "quickly","quiet","quietly","quite","rabbit","race","radio","railroad",
    "rain","raise","ran","ranch","range","rapidly","rate","rather",
    "raw","rays","reach","read","reader","ready","real","realize",
    "rear","reason","recall","receive","recent","recently","recognize","record",
    "red","refer","refused","region","regular","related","relationship","religious",
    "remain","remarkable","remember","remove","repeat","replace","replied","report",
    "represent","require","research","respect","rest","result","return","review",
    "rhyme","rhythm","rice","rich","ride","riding","right","ring",
    "rise","rising","river","road","roar","rock","rocket","rocky",
    "rod","roll","roof","room","root","rope","rose","rough",
    "round","route","row","rubbed","rubber","rule","ruler","run",
    "running","rush","sad","saddle","safe","safety","said","sail",
    "sale","salmon","salt","same","sand","sang","sat","satellites",
    "satisfied","save","saved","saw","say","scale","scared","scene",
    "school","science","scientific","scientist","score","screen","sea","search",
    "season","seat","second","secret","section","see","seed","seeing",
    "seems","seen","seldom","select","selection","sell","send","sense",
    "sent","sentence","separate","series","serious","serve","service","sets",
    "setting","settle","settlers","seven","several","shade","shadow","shake",
    "shaking","shall","shallow","shape","share","sharp","she","sheep",
    "sheet","shelf","shells","shelter","shine","shinning","ship","shirt",
    "shoe","shoot","shop","shore","short","shorter","shot","should",
    "shoulder","shout","show","shown","shut","sick","sides","sight",
    "sign","signal","silence","silent","silk","silly","silver","similar",
    "simple","simplest","simply","since","sing","single","sink","sister",
    "sit","sitting","situation","six","size","skill","skin","sky",
    "slabs","slave","sleep","slept","slide","slight","slightly","slip",
    "slipped","slope","slow","slowly","small","smaller","smallest","smell",
    "smile","smoke","smooth","snake","snow","so","soap","social",
    "society","soft","softly","soil","solar","sold","soldier","solid",
    "solution","solve","some","somebody","somehow","someone","something","sometime",
    "somewhere","son","song","soon","sort","sound","source","south",
    "southern","space","speak","special","species","specific","speech","speed",
    "spell","spend","spent","spider","spin","spirit","spite","split",
    "spoken","sport","spread","spring","square","stage","stairs","stand",
    "standard","star","stared","start","state","statement","station","stay",
    "steady","steam","steel","steep","stems","step","stepped","stick",
    "stiff","still","stock","stomach","stone","stood","stop","stopped",
    "store","storm","story","stove","straight","strange","stranger","straw",
    "stream","street","strength","stretch","strike","string","strip","strong",
    "stronger","struck","structure","struggle","stuck","student","studied","studying",
    "subject","substance","success","successful","such","sudden","suddenly","sugar",
    "suggest","suit","sum","summer","sun","sunlight","supper","supply",
    "support","suppose","sure","surface","surprise","surrounded","swam","sweet",
    "swept","swim","swimming","swing","swung","syllable","symbol","system",
    "table","tail","take","taken","tales","talk","tall","tank",
    "tape","task","taste","taught","tax","tea","teach","teacher",
    "team","tears","teeth","telephone","television","tell","temperature","ten",
    "tent","term","terrible","test","than","thank","that","thee",
    "them","themselves","then","theory","there","therefore","these","they",
    "thick","thin","thing","think","third","thirty","this","those",
    "thou","though","thought","thousand","thread","three","threw","throat",
    "through","throughout","throw","thrown","thumb","thus","thy","tide",
    "tie","tight","tightly","till","time","tin","tiny","tip",
    "tired","title","to","tobacco","today","together","told","tomorrow",
    "tone","tongue","tonight","too","took","tool","top","topic",
    "torn","total","touch","toward","tower","town","toy","trace",
    "track","trade","traffic","trail","train","transportation","trap","travel",
    "treated","tree","triangle","tribe","trick","tried","trip","troops",
    "tropical","trouble","truck","trunk","truth","try","tube","tune",
    "turn","twelve","twenty","twice","two","type","typical","uncle",
    "under","underline","understanding","unhappy","union","unit","universe","unknown",
    "unless","until","unusual","up","upon","upper","upward","us",
    "use","useful","using","usual","usually","valley","valuable","value",
    "vapor","variety","various","vast","vegetable","verb","vertical","very",
    "vessels","victory","view","village","visit","visitor","voice","volume",
    "vote","vowel","voyage","wagon","wait","walk","wall","want",
    "war","warm","warn","was","wash","waste","watch","water",
    "wave","way","we","weak","wealth","wear","weather","week",
    "weigh","weight","welcome","well","went","were","west","western",
    "wet","whale","what","whatever","wheat","wheel","when","whenever",
    "where","wherever","whether","which","while","whispered","whistle","white",
    "who","whole","whom","whose","why","wide","widely","wife",
    "wild","will","willing","win","wind","window","wing","winter",
    "wire","wise","wish","with","within","without","wolf","women",
    "won","wonder","wonderful","wood","wooden","wool","word","wore",
    "work","worker","world","worried","worry","worse","worth","would",
    "wrapped","write","writer","writing","written","wrong","wrote","yard",
    "year","yellow","yes","yesterday","yet","you","young","younger",
    "your","yourself","youth","zero","zebra","zipper","zoo","zulu"
  ];

  var rand = wordList[Math.floor(Math.random() * wordList.length)];
  return rand;

}
