// 房間管理模組
// 負責建立、刪除房間，管理房間內玩家

const rooms = {};

module.exports = {
  createRoom(roomId) {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [] };
    }
  },
  joinRoom(roomId, player) {
    if (!rooms[roomId]) this.createRoom(roomId);
    rooms[roomId].players.push(player);
  },
  leaveRoom(roomId, playerId) {
    if (rooms[roomId]) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== playerId);
      if (rooms[roomId].players.length === 0) delete rooms[roomId];
    }
  },
  getRoom(roomId) {
    return rooms[roomId];
  },
  getAllRooms() {
    return rooms;
  }
};
