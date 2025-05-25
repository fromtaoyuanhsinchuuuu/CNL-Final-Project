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
let players = {};
let messages = {};
let gameStates = {};

io.on('connection', (socket) => {
  let currentRoomId = null;
  let userId = socket.id;

  // 傳送目前房間列表
  socket.emit('rooms', rooms);

  // 建立房間
  socket.on('createRoom', (roomName) => {
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
  socket.on('joinRoom', (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    currentRoomId = roomId;
    room.currentPlayers++;
    if (!players[roomId]) players[roomId] = [];
    players[roomId].push({ id: userId, name: `User-${userId.slice(-4)}`, isOnline: true, score: 0 });
    if (!messages[roomId]) messages[roomId] = [];
    if (!gameStates[roomId]) gameStates[roomId] = null;
    io.emit('rooms', rooms);
    io.to(roomId).emit('players', players[roomId]);
    socket.join(roomId);
    socket.emit('players', players[roomId]);
    socket.emit('messages', messages[roomId]);
    socket.emit('gameState', gameStates[roomId]);
  });

  // 離開房間
  socket.on('leaveRoom', () => {
    if (!currentRoomId) return;
    const room = rooms.find(r => r.id === currentRoomId);
    if (room) {
      room.currentPlayers = Math.max(0, room.currentPlayers - 1);
      players[currentRoomId] = (players[currentRoomId] || []).filter(p => p.id !== userId);
      io.to(currentRoomId).emit('players', players[currentRoomId]);
      io.emit('rooms', rooms);
    }
    socket.leave(currentRoomId);
    currentRoomId = null;
  });

  // 發送訊息/猜題
  socket.on('sendMessage', ({ content, isGuess }) => {
    if (!currentRoomId) return;
    const msg = {
      id: `msg-${Date.now()}`,
      userId,
      userName: `User-${userId.slice(-4)}`,
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
      io.to(currentRoomId).emit('gameState', gameState);
    }
    messages[currentRoomId].push(msg);
    io.to(currentRoomId).emit('messages', messages[currentRoomId]);
  });

  // 上傳畫圖
  socket.on('submitDrawing', (dataUrl) => {
    // 這裡可擴充儲存畫圖資料
    // 廣播給房間其他人
    if (currentRoomId) {
      socket.to(currentRoomId).emit('drawing', { userId, dataUrl });
    }
  });

  // 開始遊戲
  socket.on('startGame', () => {
    if (!currentRoomId) return;
    const word = 'apple'; // 可改成隨機題庫
    const playerList = players[currentRoomId] || [];
    const scores = {};
    playerList.forEach(p => { scores[p.id] = 0; });
    gameStates[currentRoomId] = {
      currentDrawer: playerList[0]?.id || null,
      currentWord: word,
      timeRemaining: 120,
      roundNumber: 1,
      totalRounds: 3,
      scores,
      isRoundOver: false,
    };
    rooms.find(r => r.id === currentRoomId).status = 'playing';
    io.emit('rooms', rooms);
    io.to(currentRoomId).emit('gameState', gameStates[currentRoomId]);
  });

  // 結束回合
  socket.on('endRound', () => {
    if (!currentRoomId) return;
    const gameState = gameStates[currentRoomId];
    if (gameState) {
      gameState.isRoundOver = true;
      gameState.correctAnswer = gameState.currentWord;
      io.to(currentRoomId).emit('gameState', gameState);
    }
  });

  // 斷線處理
  socket.on('disconnect', () => {
    if (currentRoomId) {
      const room = rooms.find(r => r.id === currentRoomId);
      if (room) {
        room.currentPlayers = Math.max(0, room.currentPlayers - 1);
        players[currentRoomId] = (players[currentRoomId] || []).filter(p => p.id !== userId);
        io.to(currentRoomId).emit('players', players[currentRoomId]);
        io.emit('rooms', rooms);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
