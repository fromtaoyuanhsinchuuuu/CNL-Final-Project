// 遊戲邏輯管理模組
// 控制遊戲流程、出題、判斷答案、計分

const games = {};

module.exports = {
  startGame(roomId) {
    // 初始化遊戲狀態
    games[roomId] = {
      round: 1,
      scores: {},
      currentWord: null,
      // ...其他狀態
    };
  },
  setWord(roomId, word) {
    if (games[roomId]) {
      games[roomId].currentWord = word;
    }
  },
  checkAnswer(roomId, answer) {
    if (games[roomId]) {
      return games[roomId].currentWord === answer;
    }
    return false;
  },
  addScore(roomId, playerId) {
    if (games[roomId]) {
      if (!games[roomId].scores[playerId]) games[roomId].scores[playerId] = 0;
      games[roomId].scores[playerId] += 1;
    }
  },
  getGame(roomId) {
    return games[roomId];
  },
  endGame(roomId) {
    delete games[roomId];
  }
};
