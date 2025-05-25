# Drawing Game Server

這是你畫我猜多人連線遊戲的後端伺服器。

## 檔案說明
- `index.js`：伺服器進入點，啟動 HTTP + WebSocket，處理玩家連線、事件分發。
- `roomManager.js`：房間管理，建立/刪除房間、管理玩家。
- `gameManager.js`：遊戲邏輯，出題、判斷答案、計分、回合控制。
- `package.json`：Node.js 專案設定與依賴。

## 啟動方式
1. 安裝依賴：
   ```bash
   npm install
   ```
2. 啟動伺服器：
   ```bash
   npm start
   ```

## 功能概要
- 支援多人房間、即時畫圖、猜題、聊天。
- 可與 React 前端透過 socket.io 連線。

---
如需擴充功能，請修改對應模組。
