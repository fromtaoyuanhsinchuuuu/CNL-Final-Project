// gameManager.js
let io; // Socket.IO instance
let allPlayers; // Reference to the global allPlayers array from index.js
let userSocketMap; // Reference to the global userSocketMap from index.js
let gameStates = {}; // Stores game state for each room: { roomId: { currentDrawer, currentWord, timeRemaining, ... } }
let roundTimeouts = {}; // Stores timeouts for each room to end rounds
let historyPredictions = {}; // Stores history of predictions for each bot in each room

// We need access to roomManager's data
const roomManager = require('./roomManager'); // Import roomManager here
const botManager = require('./AIBotManager'); // Import AIBotManager for bot management

const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'data', 'categories-short.txt');
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  return [];
}
const fileContent = fs.readFileSync(filePath, 'utf-8');
const wordbank = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
console.log(`Loaded ${wordbank.length} words from categories-short.txt`);
const getRandomProblem = () => {
  if (wordbank.length === 0) {
    console.error('No words available for selection.');
    return null;
  }
  const randomIndex = Math.floor(Math.random() * wordbank.length);
  return wordbank[randomIndex];
}


module.exports = {
  init: (socketIoInstance, globalAllPlayers, globalUserSocketMap) => {
    io = socketIoInstance;
    allPlayers = globalAllPlayers;
    userSocketMap = globalUserSocketMap;
    console.log('GameManager initialized.');
  },

  getGameState: (roomId) => {
    return gameStates[roomId];
  },

  sendMessage: (socket, userId, content, isGuess) => {
    // Determine currentRoomId. If from AI bot, socket.id will be userId (or null)
    // const currentRoomId = (socket && socket.id) ? roomManager.getSocketRoomMap()[socket.id] :
    //                       roomManager.getRoomIdByPlayerId(userId); // New helper in roomManager

    let currentRoomId;
    if (userId && userId.startsWith('ai')) {
      // NOTE: If the userId is an AI bot, the socket.id is actually the roomId
      // See aiBotManager.js for how this is set up
      console.log("[GameManager] AI bot detected, using socket.id as roomId");
      currentRoomId = socket.id;
    } else {
      currentRoomId = roomManager.getSocketRoomMap()[socket.id];
    }
    console.log(`Received sendMessage from ${socket.id} (user: ${userId}) in room ${currentRoomId}: ${content} (isGuess: ${isGuess})`);
    if (!currentRoomId) return;

    const msg = {
      id: `msg-${Date.now()}`,
      userId,
      userName: roomManager.getPlayersInRoom(currentRoomId).find(p => p.id === userId)?.name || userId, // Get player name
      content,
      timestamp: Date.now(),
      isGuess,
      isCorrectGuess: false,
    };

    const gameState = gameStates[currentRoomId];
    if (isGuess && gameState.currentCorrects[userId] === true) {
      // Prevent multiple correct guesses from the same user
      console.log(`User ${userId} has already guessed correctly in this round.`);
      return;
    }
    if (isGuess && gameState && gameState.currentWord 
      && content.toLowerCase() === gameState.currentWord.toLowerCase()) {
      msg.isCorrectGuess = true;
      msg.content = `${msg.userName} guessed correctly`;
      // Update score in gameStates and playersInRooms
      const playerList = roomManager.getPlayersInRoom(currentRoomId);
      const player = playerList.find(p => p.id === userId);
      if (player) {
        player.score = (player.score || 0) + 10; // Update score in roomManager's player list
      }
      gameState.scores[userId] = (gameState.scores[userId] || 0) + 10;
      gameState.currentCorrects[userId] = true; // Mark this user as having guessed correctly
      io.to(currentRoomId).emit('gameState', gameState); // Broadcast game state update (scores)
      io.to(currentRoomId).emit('players', playerList); // Broadcast updated player list (scores)
    }

    roomManager.addMessageToRoom(currentRoomId, msg); // Let roomManager handle message storage and broadcast
  },

  handleBotGuess: (predictionId, botId, guess) => {
    console.log("[handleBotGuess] Bot guess received:", botId, guess);
    if (historyPredictions[predictionId]) {
      console.log(`Prediction ID ${predictionId} already processed for bot ${botId}. Ignoring duplicate.`);
      return; // Ignore duplicate guesses
    }
    // console.log(`Bot ${botId} guessed: ${guess}`);
    const currentRoomId = botManager.getRoomIdByBotId(botId);
    // if (!currentRoom) {
    //   console.error(`[a] No room found for bot ${botId}`);
    //   return;
    // }
    // const currentRoomId = currentRoom ? currentRoom.id : null;
    if (!currentRoomId) {
      console.error(`No room found for bot ${botId}`);
      return;
    }
    historyPredictions[predictionId] = true; // Mark this prediction as processed

    const gameState = gameStates[currentRoomId];
    if (!gameState) {
      console.error(`No game state found for room ${currentRoomId}`);
      return;
    }

    const msg = {
      id: `msg-${Date.now()}`,
      userId: botId,
      userName: roomManager.getPlayersInRoom(currentRoomId).find(p => p.id === botId)?.name || botId, // Get player name
      content: guess,
      timestamp: Date.now(),
      isGuess: true,
      isCorrectGuess: false,
    };

    // Check if the guess is correct
    if (gameState.currentWord && guess.toLowerCase() === gameState.currentWord.toLowerCase()) {
      // Bot guessed correctly
      msg.isCorrectGuess = true;
      msg.content = `${msg.userName} guessed correctly`;
      const playerList = roomManager.getPlayersInRoom(currentRoomId);
      const botPlayer = playerList.find(p => p.id === botId);
      if (botPlayer) {
        botPlayer.score = (botPlayer.score || 0) + 10; // Update bot score
        gameState.scores[botId] = (gameState.scores[botId] || 0) + 10; // Update game state scores
        gameState.currentCorrects[botId] = true; // Mark this bot as having guessed correctly
        io.to(currentRoomId).emit('gameState', gameState); // Broadcast updated game state
        io.to(currentRoomId).emit('players', playerList); // Broadcast updated player list
      }
      console.log(`Bot ${botId} guessed correctly in room ${currentRoomId}`);
    } else {
      console.log(`Bot ${botId} guessed incorrectly in room ${currentRoomId}`);
    }
    roomManager.addMessageToRoom(currentRoomId, msg); // Let roomManager handle message storage and broadcast
  },

  submitDrawing: (socket, userId, dataUrl) => {
    const currentRoomId = roomManager.getSocketRoomMap()[socket.id];
    // console.log(`Received submitDrawing from ${socket.id} (user: ${userId}) in room ${currentRoomId}: ${dataUrl.substring(0, 20)}...`);
    if (currentRoomId) {
      socket.to(currentRoomId).emit('drawing', { userId, dataUrl });
    }
  },

  startGame: (socket, userId) => {
    const currentRoomId = roomManager.getSocketRoomMap()[socket.id];
    console.log(`Received startGame from ${socket.id} (user: ${userId}) in room ${currentRoomId}`);
    if (!currentRoomId) return;

    const playerList = roomManager.getPlayersInRoom(currentRoomId);
    // Basic host validation: first player in the room
    if (playerList.length === 0 || playerList[0].id !== userId) {
      console.log(`Client ${socket.id} is not the host of room ${currentRoomId}. Cannot start game.`);
      return;
    }

    // clear room messages
    roomManager.clearRoomMessage(currentRoomId); // Clear messages for a fresh start
    // You can implement more sophisticated word selection here    
    const word = getRandomProblem();
    const scores = {};
    const currentCorrects = {}; // Track correct guesses for the current round
    playerList.forEach(p => { scores[p.id] = 0; }); // Initialize scores for all players

    gameStates[currentRoomId] = {
      currentDrawer: null,
      currentWord: '',
      timeRemaining: 120,
      roundNumber: 0,
      totalRounds: 3,
      scores,
      currentCorrects,
      isRoundOver: false,
    };

    // Update room status via roomManager if needed (e.g., room status from 'waiting' to 'playing')
    const room = roomManager.getRoomById(currentRoomId);
    if (room) {
      room.status = 'playing';
      roomManager.roomUpdateBroadcast(); // Broadcast updated room list
      // io.emit('rooms', roomManager.rooms); // Broadcast updated room list
    }

    io.to(currentRoomId).emit('gameState', gameStates[currentRoomId]);

    botManager.addRoom(currentRoomId); // Ensure the room is added to botManager
    botManager.addBotToRoom(currentRoomId, `ai_bot_${currentRoomId}_1`);
    botManager.startAllBotsInRoom(currentRoomId); // Start all bots in the room if any

    // Notify the current drawer
    module.exports.startRound(currentRoomId);
  },

  startRound: (roomId) => {
    const gameState = gameStates[roomId];
    const playerList = roomManager.getPlayersInRoom(roomId);
    if (!gameState || !playerList || playerList.length === 0) return;

    if (gameState.roundNumber > gameState.totalRounds) {
      // Game over
      roomManager.getRoomById(roomId).status = 'waiting';
      roomManager.roomUpdateBroadcast(); // Broadcast updated room list
      botManager.removeAllBotsFromRoom(roomId); // Stop all bots in the room
      io.to(roomId).emit('gameOver', gameState);
      return;
    }

    // Choose next drawer: round robin
    const prevDrawerIndex = (gameState.roundNumber + playerList.length - 1) % playerList.length;
    const prevDrawerId = playerList[prevDrawerIndex].id;
    const nextDrawerIndex = (gameState.roundNumber + playerList.length) % playerList.length;
    const nextDrawerId = playerList[nextDrawerIndex].id;

    // New word each round (for now hardcoded, can randomize)
    const word = getRandomProblem();
    const roundDuration = 20;

    // Update state
    gameState.roundNumber++;
    gameState.currentDrawer = nextDrawerId;
    gameState.currentWord = word;
    gameState.timeRemaining = roundDuration;
    gameState.isRoundOver = false;
    for (const userId in gameState.currentCorrects) {
      gameState.currentCorrects[userId] = false; // Reset correct guesses for the next round
    }
    delete gameState.correctAnswer;

    io.to(roomId).emit('gameState', gameState);
    if (userSocketMap[nextDrawerId]) {
      io.to(userSocketMap[nextDrawerId]).emit('isDrawingTurn', true);
    }
    if (userSocketMap[prevDrawerId] && (prevDrawerId != nextDrawerId)) {
      io.to(userSocketMap[prevDrawerId]).emit('isDrawingTurn', false);
    }

    // Set timeout to end round after time
    if (roundTimeouts[roomId]) clearTimeout(roundTimeouts[roomId]);
    roundTimeouts[roomId] = setTimeout(() => {
      console.log(`Room ${roomId}: Round ${gameState.roundNumber} time's up.`);
      module.exports.endRound(roomId)
    }, roundDuration * 1000);
  },

  endRound: (roomId) => {
    if (!roomId) return;
    const gameState = gameStates[roomId];
    if (!gameState || gameState.isRoundOver) return;

    // Clear the active round timer
    if (roundTimeouts[roomId]) {
        clearTimeout(roundTimeouts[roomId]);
        delete roundTimeouts[roomId];
    }

    gameState.isRoundOver = true;
    gameState.correctAnswer = gameState.currentWord;
    io.to(roomId).emit('gameState', gameState);

    // Game over logic
    if (gameState.roundNumber >= gameState.totalRounds) {
      console.log(`Game over in room ${roomId}.`);
      roomManager.getRoomById(roomId).status = 'waiting'; // Update room status
      // io.emit('rooms', rooms);
      roomManager.roomUpdateBroadcast(); // Broadcast updated room list
      botManager.removeAllBotsFromRoom(roomId); // Stop all bots in the room
      io.to(roomId).emit('gameOver', gameState);
      return;
    }

    // Schedule next round in 5 seconds
    setTimeout(() => {
      console.log(`Starting round ${gameState.roundNumber + 1} in room ${roomId}`);
      module.exports.startRound(roomId);
    }, 5000); // 5 seconds
  },

  handleCanvasUpdate: (socket, dataUrl) => {
    const currentRoomId = roomManager.getSocketRoomMap()[socket.id];
    if (currentRoomId) {
      socket.to(currentRoomId).emit('canvasUpdate', dataUrl);
    }
  },

  // This would be called by the roomManager when a player disconnects
  // to clean up game state if necessary, e.g., if the drawer disconnects
  handlePlayerDisconnect: (userId) => {
    // You might need to iterate through gameStates to find rooms where this user was active
    // and potentially adjust game state (e.g., reassign drawer)
    console.log(`GameManager handling disconnect for user: ${userId}`);
    // Example: If a drawer disconnects, advance the turn or end the round
    for (const roomId in gameStates) {
      const gameState = gameStates[roomId];
      if (gameState && gameState.currentDrawer === userId) {
        console.log(`Current drawer ${userId} disconnected in room ${roomId}. Ending round.`);
        // Implement logic to end round or choose next drawer
        // For simplicity, let's just end the round here
        gameState.isRoundOver = true;
        gameState.correctAnswer = gameState.currentWord;
        io.to(roomId).emit('gameState', gameState);
        // You might want to also trigger a new round or end the game here
      }
    }
  },
};