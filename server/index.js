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
// These top-level states will be managed by index.js and passed to managers as needed
let userIdCounter = 1;
let allPlayers = []; // All players connected to the server
let userSocketMap = {}; // Maps userId to socket.id

// Initialize managers with the io instance for broadcasting
roomManager.init(io, allPlayers, userSocketMap);
gameManager.init(io, allPlayers, userSocketMap);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  let currentRoomId = null; // This will now be managed per socket in roomManager
  let userId = `user-${userIdCounter}`;
  userSocketMap[userId] = socket.id;
  allPlayers.push({ id: userId, name: `User-${userIdCounter}`, isOnline: true, score: 0 });
  userIdCounter++;

  console.log(`Emitting userId to client ${socket.id}: ${userId}`);
  socket.emit('userId', userId);

  // Delegate connection handling to roomManager
  roomManager.handlePlayerConnect(socket, userId);

  // Room Management Events
  socket.on('createRoom', (roomName) => {
    roomManager.createRoom(socket, roomName);
  });

  socket.on('joinRoom', (roomId) => {
    console.log("Received joinRoom event:", roomId);
    roomManager.joinRoom(socket, userId, roomId);
  });

  socket.on('leaveRoom', () => {
    roomManager.leaveRoom(socket, userId);
  });

  // Game Management Events
  socket.on('sendMessage', ({ content, isGuess }) => {
    gameManager.sendMessage(socket, userId, content, isGuess);
  });

  socket.on('submitDrawing', (dataUrl) => {
    gameManager.submitDrawing(socket, userId, dataUrl);
  });

  socket.on('startGame', () => {
    gameManager.startGame(socket, userId);
  });

  socket.on('endRound', () => {
    gameManager.endRound(socket);
  });

  socket.on('canvasUpdate', (dataUrl) => {
    gameManager.handleCanvasUpdate(socket, dataUrl);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    roomManager.handlePlayerDisconnect(socket, userId);

    // Remove the player from allPlayers and userSocketMap
    allPlayers = allPlayers.filter(p => p.id !== userId);
    delete userSocketMap[userId];

    console.log(`Player ${userId} disconnected.`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log('Server is fully started and listening.');
});