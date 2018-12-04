# Typrant

This is a typing game where interactivity is inherent to the user experience. Many typing softwares add interactivity as an after thought. Here typing is the core of pvp interaction. Players will roam a map looking to collide with other players. After a collision a typing battle will be initiated. Winners will move up the score board and losers will fade away.

The goal for this project is to provide a typing software that is actually effective for teaching kids how to type. Most people who type 80+ wpm on a 10fastfingers typing test learned to typing through alternative means: star craft, instant messaging, school essays. 

Strategy:
1. Provide a competitive platform for pvp interaction
2. Create a single player mode that teaches typing best practices 
3. Track progression through playable achievements (skins) 

The hope is that through competition kids will be more inclined to learn. Also awarding achievements that are playable and other people interact with will increase their value.

## Running the Code

First use `npm install` to download dependencies from package.json. Then run `node server.js`.

## Dependencies

This project is based in javascript, and we are using npm to manage packages. The project dependencies are:
1. socket.io
2. express
3. phaser3

## Structure

Currently all the game logic is in `public/js/game.js` and all the server logic is in `server.js`. We hope to change this and properly manage all the scenes in different folders. All game assets are in the `public/assets/` folder. 

## Contributing

We will be populating the Issues and Projects board soon! We hope to make it as easy as possible to contribute to this project. 

We also have a small growing group of alpha testers. Alpha play tester will be alerted when the game will be up on the web at: https://cs141-kaikaikoala.c9users.io/ . Please email kaishinpk@gmail.com if you would like to be added to the group. Currently we host the game on a temporary aws c9 server for 30 minute play tests. 

