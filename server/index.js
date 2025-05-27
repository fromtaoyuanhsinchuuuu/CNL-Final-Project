// 主伺服器進入點，啟動 HTTP + WebSocket 服務
// 處理玩家連線、房間管理、遊戲邏輯

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const roomManager = require('./roomManager');
const gameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// 狀態資料（簡易記憶體版）
let rooms = [
  { id: '1', name: 'Fun Room A', currentPlayers: 0, maxPlayers: 8, status: 'waiting' },
  { id: '2', name: 'Serious Players Only B', currentPlayers: 0, maxPlayers: 8, status: 'waiting' },
];
let userIdCounter = 1;
let allPlayers = [];
let players = {};
let messages = {};
let gameStates = {};
let userSocketMap = {};
let roundTimeouts = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  let currentRoomId = null;
  // let userId = socket.id;
  let userId = `user-${userIdCounter}`; // 使用簡單的自增 ID 來模擬玩家 ID
  userSocketMap[userId] = socket.id; // 新增這行
  allPlayers.push({ id: userId, name: `User-${userIdCounter}`, isOnline: true, score: 0 });
  userIdCounter++;

  // send user ID to the client
  console.log(`Emitting userId to client ${socket.id}: ${userId}`);
  socket.emit('userId', userId);

  // 傳送目前房間列表
  console.log(`Setting up 'rooms' emit for new client ${socket.id}`);
  socket.emit('rooms', rooms);

  // 建立房間
  console.log(`Setting up 'createRoom' listener for client ${socket.id}`);
  socket.on('createRoom', (roomName) => {
    console.log(`Received createRoom from ${socket.id}: ${roomName}`);
    const newRoom = {
      id: `${Date.now()}`,
      name: roomName,
      currentPlayers: 0,
      maxPlayers: 8,
      status: 'waiting',
    };
    rooms.push(newRoom);
    io.emit('rooms', rooms);
  });

  // 加入房間
  console.log(`Setting up 'joinRoom' listener for client ${socket.id}`);
  socket.on('joinRoom', (roomId) => {
    console.log(`Received joinRoom from ${socket.id}: ${roomId}`);
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      console.log(`Room ${roomId} not found.`);
      return;
    }
    currentRoomId = roomId;
    room.currentPlayers++;
    if (!players[roomId]) players[roomId] = [];
    const newUser = { id: userId, name: `User-${userId.slice(-4)}`, isOnline: true, score: 0 };
    players[roomId].push(newUser);
    if (!messages[roomId]) messages[roomId] = [];
    if (!gameStates[roomId]) gameStates[roomId] = null;
    console.log(`User ${socket.id} joined room ${roomId}. Current players: `, players[roomId]);
    io.emit('rooms', rooms); // 廣播房間列表更新
    io.to(roomId).emit('players', players[roomId]); // 廣播房間玩家列表更新
    socket.join(roomId);
    // 新加入的玩家也需要收到當前的訊息和遊戲狀態
    socket.emit('messages', messages[roomId]);
    socket.emit('gameState', gameStates[roomId]);

    // 廣播玩家列表更新
    socket.emit('players', players[roomId]);

    // 向發起請求的客戶端發送成功加入房間的確認事件
    console.log(`Emitting roomJoined to client ${socket.id} with room data:`, room);
    socket.emit('roomJoined', room);
  });

  // 離開房間
  console.log(`Setting up 'leaveRoom' listener for client ${socket.id}`);
  socket.on('leaveRoom', () => {
    console.log(`Received leaveRoom from ${socket.id}`);
    const roomIdToLeave = currentRoomId; // Store before setting to null
    if (!roomIdToLeave) return;

    const room = rooms.find(r => r.id === roomIdToLeave);
    if (room) {
      room.currentPlayers = Math.max(0, room.currentPlayers - 1);
      players[roomIdToLeave] = (players[roomIdToLeave] || []).filter(p => p.id !== userId);
      console.log(`User ${socket.id} left room ${roomIdToLeave}. Current players: `, players[roomIdToLeave]);
      io.to(roomIdToLeave).emit('players', players[roomIdToLeave]); // 廣播更新後的玩家列表
      io.emit('rooms', rooms); // 廣播更新後的房間列表 (人數變化)
    }
    socket.leave(roomIdToLeave);
    currentRoomId = null; // 更新伺服器端該 socket 的房間狀態

    // 向發起請求的客戶端發送成功離開房間的確認事件
    console.log(`Emitting leftRoom to client ${socket.id}`);
    socket.emit('leftRoom');
  });

  // 發送訊息/猜題
  console.log(`Setting up 'sendMessage' listener for client ${socket.id}`);
  socket.on('sendMessage', ({ content, isGuess }) => {
    console.log(`Received sendMessage from ${socket.id} in room ${currentRoomId}: ${content} (isGuess: ${isGuess})`);
    if (!currentRoomId) return;
    const msg = {
      id: `msg-${Date.now()}`,
      userId,
      userName: userId,
      content,
      timestamp: Date.now(),
      isGuess,
      isCorrectGuess: false,
    };
    // 判斷猜題正確
    const gameState = gameStates[currentRoomId];
    if (isGuess && gameState && gameState.currentWord && content.toLowerCase() === gameState.currentWord.toLowerCase()) {
      msg.isCorrectGuess = true;
      // 加分
      const player = players[currentRoomId].find(p => p.id === userId);
      if (player) player.score = (player.score || 0) + 10;
      gameState.scores[userId] = (gameState.scores[userId] || 0) + 10;
      io.to(currentRoomId).emit('gameState', gameState); // 廣播遊戲狀態更新 (分數)
    }
    messages[currentRoomId].push(msg);
    io.to(currentRoomId).emit('messages', messages[currentRoomId]); // 廣播訊息列表更新
  });

  // 上傳畫圖
  console.log(`Setting up 'submitDrawing' listener for client ${socket.id}`);
  socket.on('submitDrawing', (dataUrl) => {
    console.log(`Received submitDrawing from ${socket.id} in room ${currentRoomId}: ${dataUrl.substring(0, 20)}...`);
    // 這裡可擴充儲存畫圖資料
    // 廣播給房間其他人
    if (currentRoomId) {
      socket.to(currentRoomId).emit('drawing', { userId, dataUrl });
    }
  });

  // 開始回合
  function startRound(roomId) {
    const state = gameStates[roomId];
    const playerList = players[roomId];
    if (!state || !playerList || playerList.length === 0) return;

    if (state.roundNumber > state.totalRounds) {
      // Game over
      rooms.find(r => r.id === roomId).status = 'waiting';
      io.emit('rooms', rooms);
      io.to(roomId).emit('gameOver', state);
      return;
    }

    // Choose next drawer: round robin
    const prevDrawerIndex = (state.roundNumber + playerList.length - 2) % playerList.length;
    const prevDrawerId = playerList[prevDrawerIndex].id;
    const nextDrawerIndex = (state.roundNumber + playerList.length - 1) % playerList.length;
    const nextDrawerId = playerList[nextDrawerIndex].id;

    // New word each round (for now hardcoded, can randomize)
    const word = 'banana'; // TODO: replace with word bank randomization if needed
    const roundDuration = 20;

    // Update state
    state.currentDrawer = nextDrawerId;
    state.currentWord = word;
    state.timeRemaining = roundDuration;
    state.isRoundOver = false;
    delete state.correctAnswer;

    io.to(roomId).emit('gameState', state);
    if (userSocketMap[nextDrawerId]) {
      io.to(userSocketMap[nextDrawerId]).emit('isDrawingTurn', true);
    }
    if (userSocketMap[prevDrawerId] && (prevDrawerId != nextDrawerId)) {
      io.to(userSocketMap[prevDrawerId]).emit('isDrawingTurn', false);
    }

    // Set timeout to end round after time
    if (roundTimeouts[roomId]) clearTimeout(roundTimeouts[roomId]);
    roundTimeouts[roomId] = setTimeout(() => endRound(roomId), roundDuration * 1000);
  }

  // 開始遊戲
  socket.on('startGame', () => {
    console.log(`Received startGame from ${socket.id} in room ${currentRoomId}`);
    if (!currentRoomId) return;

    const playerList = players[currentRoomId] || [];
    if (playerList.length === 0 || playerList[0].id !== userId) return;

    const scores = {};
    playerList.forEach(p => { scores[p.id] = 0; });

    gameStates[currentRoomId] = {
      currentDrawer: null,
      currentWord: '',
      timeRemaining: 0,
      roundNumber: 1,
      totalRounds: 3,
      scores,
      isRoundOver: false,
    };
    rooms.find(r => r.id === currentRoomId).status = 'playing';
    io.emit('rooms', rooms);

    startRound(currentRoomId);
  });

  // 結束回合
  function endRound(roomId) {
    const state = gameStates[roomId];
    if (!state || state.isRoundOver) return;

    state.isRoundOver = true;
    state.correctAnswer = state.currentWord;
    io.to(roomId).emit('gameState', state);

    // Schedule next round in 10 seconds
    setTimeout(() => {
      if (state.roundNumber < state.totalRounds) {
        state.roundNumber++;
        startRound(roomId);
      } else {
        // Final round just ended
        rooms.find(r => r.id === roomId).status = 'waiting';
        io.emit('rooms', rooms);
        io.to(roomId).emit('gameOver', state);
      }
    }, 10000); // 10 seconds
  }

  // 同步畫布更新
  socket.on('canvasUpdate', (dataUrl) => {
    socket.to(currentRoomId).emit('canvasUpdate', dataUrl);
  });


  // 斷線處理
  console.log(`Setting up 'disconnect' listener for client ${socket.id}`);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (currentRoomId) {
      const room = rooms.find(r => r.id === currentRoomId);
      if (room) {
        room.currentPlayers = Math.max(0, room.currentPlayers - 1);
        players[currentRoomId] = (players[currentRoomId] || []).filter(p => p.id !== userId);
        io.to(currentRoomId).emit('players', players[currentRoomId]);
        io.emit('rooms', rooms);
      }
    }

    // remove the player from allPlayers
    allPlayers = allPlayers.filter(p => p.id !== userId);
    // 移除 userSocketMap
    for (const [uid, sid] of Object.entries(userSocketMap)) {
      if (sid === socket.id) {
        delete userSocketMap[uid];
        break;
      }
    }
    console.log(`Player ${userId} disconnected. Current players in room ${currentRoomId}:`, players[currentRoomId]);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log('Server is fully started and listening.'); // 新增日誌
});
