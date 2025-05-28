// roomManager.js
const { v4: uuidv4 } = require('uuid'); // To generate unique IDs, you might need to `npm install uuid`

let io; // Socket.IO instance
let rooms = [
  { id: '1', name: 'Fun Room A', currentPlayers: 0, maxPlayers: 8, status: 'waiting' },
  { id: '2', name: 'Serious Players Only B', currentPlayers: 0, maxPlayers: 8, status: 'waiting' },
];
let playersInRooms = {}; // Stores players for each room: { roomId: [{id, name, isOnline, score}] }
let messagesInRooms = {}; // Stores messages for each room: { roomId: [{...messageData}] }
let userSocketMap; // Reference to the global userSocketMap from index.js
let allPlayers; // Reference to the global allPlayers array from index.js

// Map socket.id to currentRoomId for quick lookup
let socketRoomMap = {}; // { socket.id: roomId }

module.exports = {
  init: (socketIoInstance, globalAllPlayers, globalUserSocketMap) => {
    io = socketIoInstance;
    allPlayers = globalAllPlayers;
    userSocketMap = globalUserSocketMap;
    console.log('RoomManager initialized.');
  },

  getRoomById: (roomId) => {
    return rooms.find(r => r.id === roomId);
  },

  getPlayersInRoom: (roomId) => {
    return playersInRooms[roomId] || [];
  },

  getMessagesInRoom: (roomId) => {
    return messagesInRooms[roomId] || [];
  },

  addMessageToRoom: (roomId, message) => {
    if (!messagesInRooms[roomId]) {
      messagesInRooms[roomId] = [];
    }
    messagesInRooms[roomId].push(message);
    io.to(roomId).emit('messages', messagesInRooms[roomId]);
  },

  handlePlayerConnect: (socket, userId) => {
    console.log(`Setting up 'rooms' emit for new client ${socket.id}`);
    socket.emit('rooms', rooms);
  },

  roomUpdateBroadcast: () => {
    console.log('Broadcasting updated rooms:', rooms);
    io.emit('rooms', rooms); // Broadcast updated room list to all clients
  },

  createRoom: (socket, roomName) => {
    console.log(`Received createRoom from ${socket.id}: ${roomName}`);
    const newRoom = {
      id: uuidv4(), // Use uuid for unique room IDs
      name: roomName,
      currentPlayers: 0,
      maxPlayers: 8,
      status: 'waiting',
    };
    rooms.push(newRoom);
    io.emit('rooms', rooms); // Broadcast updated room list
    console.log(`Room created: ${newRoom.name} (${newRoom.id})`);
  },

  joinRoom: (socket, userId, roomId) => {
    console.log(`Received joinRoom from ${socket.id} (user: ${userId}): ${roomId}`);
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      console.log(`Room ${roomId} not found.`);
      return;
    } else if (room.currentPlayers >= room.maxPlayers || room.status !== "waiting") {
      console.log(`Room ${roomId} player exceeded.`);
      return;
    }

    if (socketRoomMap[socket.id] && socketRoomMap[socket.id] !== roomId) {
        // If the user is already in another room, make them leave it first
        console.log(`User ${userId} (socket ${socket.id}) is already in room ${socketRoomMap[socket.id]}. Leaving previous room.`);
        module.exports.leaveRoom(socket, userId); // Use module.exports to call other functions within this module
    }

    socketRoomMap[socket.id] = roomId; // Update the map for this socket
    room.currentPlayers++;

    if (!playersInRooms[roomId]) playersInRooms[roomId] = [];
    const newUser = { id: userId, name: userId, isOnline: true, score: 0 };
    playersInRooms[roomId].push(newUser);

    if (!messagesInRooms[roomId]) messagesInRooms[roomId] = [];

    console.log(`User ${userId} joined room ${roomId}. Current players: `, playersInRooms[roomId]);

    io.emit('rooms', rooms); // Broadcast room list update (player count)
    io.to(roomId).emit('players', playersInRooms[roomId]); // Broadcast updated player list to room
    socket.join(roomId);

    // New player needs current messages
    socket.emit('messages', messagesInRooms[roomId]);

    // NOTE: 原本的 code 有送 gameState，但 joinRoom 的時候應該還不需要知道這件事情？
    // socket.emit('gameState', gameStates[roomId]); 

    // 廣播玩家列表更新
    socket.emit('players', playersInRooms[roomId]); // Send current players in the room to the joining user

    // Send success confirmation to the client
    console.log(`Emitting roomJoined to client ${socket.id} with room data:`, room);
    socket.emit('roomJoined', room);
  },

  leaveRoom: (socket, userId) => {
    console.log(`Received leaveRoom from ${socket.id} (user: ${userId})`);
    const roomIdToLeave = socketRoomMap[socket.id];
    if (!roomIdToLeave) {
        console.log(`User ${userId} (socket ${socket.id}) not in any room.`);
        return;
    }

    const room = rooms.find(r => r.id === roomIdToLeave);
    if (room) {
      room.currentPlayers = Math.max(0, room.currentPlayers - 1);
      playersInRooms[roomIdToLeave] = (playersInRooms[roomIdToLeave] || []).filter(p => p.id !== userId);

      if (room.currentPlayers === 0) {
        room.status = "waiting";
      }

      console.log(`User ${userId} left room ${roomIdToLeave}. Current players: `, playersInRooms[roomIdToLeave]);
      io.to(roomIdToLeave).emit('players', playersInRooms[roomIdToLeave]); // Broadcast updated player list
      io.emit('rooms', rooms); // Broadcast updated room list (player count)

      // If no players left, clean up the room data (optional, depends on game lifecycle)
      // if (room.currentPlayers === 0) {
      //   delete playersInRooms[roomIdToLeave];
      //   delete messagesInRooms[roomIdToLeave];
      //   // Optionally, remove the room if it's empty and not one of the pre-defined ones
      //   // rooms = rooms.filter(r => r.id !== roomIdToLeave);
      // }
    }

    socket.leave(roomIdToLeave);
    delete socketRoomMap[socket.id]; // Remove from socketRoomMap

    console.log(`Emitting leftRoom to client ${socket.id}`);
    socket.emit('leftRoom');
  },

  handlePlayerDisconnect: (socket, userId) => {
    const roomIdToLeave = socketRoomMap[socket.id];
    if (roomIdToLeave) {
        // Automatically leave the room if the user disconnects
        module.exports.leaveRoom(socket, userId);
    }
  },

  getSocketRoomMap: () => socketRoomMap, // Expose for gameManager to use
};