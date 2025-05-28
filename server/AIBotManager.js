// AIBotManager.js (or AIBotManager.ts)
const axios = require('axios'); // Use axios for HTTP requests (better than node-fetch for server-side)
const AIBot = require('./AIBot'); // Import the AIBot class
const roomManager = require('./roomManager'); // Import roomManager to access global player states
// const { User } = require('../types')
// For TypeScript:
// import axios from 'axios';
// import { Server as SocketIOServer, Socket } from 'socket.io'; // For typing

class AIBotManager {
    constructor() {
        if (AIBotManager.instance) {
            return AIBotManager.instance; // Singleton Pattern
        }
        this.rooms = {}; // Structure: { roomId: { bots: { botId: AIBotInstance }, sockets: Set<Socket> } }
        this.flaskApiUrl = 'http://127.0.0.1:5000/predict'; // Your Flask server URL
        this.io = null; // Will be set after manager is instantiated in server.js
        this.canvasUpdateCooldowns = {}; // { roomId: timestamp_of_last_prediction_request }
        this.predictionIntervalMs = 2000; // AI will make a guess at most every 1 second per room

        this.allPlayers = []; // Will be set by index.js
        this.userSocketMap = {}; // Will be set by index.js

        AIBotManager.instance = this; // Singleton Pattern
    }

    setSocketIO(ioInstance) {
        this.io = ioInstance;
    }

    setGlobalPlayerStates(allPlayersRef, userSocketMapRef) {
        this.allPlayers = allPlayersRef;
        this.userSocketMap = userSocketMapRef;
    }

    // --- Room & Socket Management ---
    addRoom(roomId) {
        if (!this.rooms[roomId]) {
            console.log(`this.rooms[roomId]`, this.rooms[roomId]);
            this.rooms[roomId] = {
                bots: {},
                sockets: new Set()
            };
            // Create a default bot for the room upon creation (or based on game logic)
            this.addBotToRoom(roomId, `ai_bot_${roomId}_1`);
            console.log(`Room ${roomId} created in AIBotManager.`);
            console.log(`Default bot ai_bot_${roomId}_1 added to room ${roomId}.`);
        }
    }

    addSocketToRoom(roomId, socket) {
        this.addRoom(roomId); // Ensure room exists
        this.rooms[roomId].sockets.add(socket);
    }

    removeSocketFromAllRooms(socket) {
        for (const roomId in this.rooms) {
            if (this.rooms[roomId].sockets.has(socket)) {
                this.rooms[roomId].sockets.delete(socket);
                // Optionally: if no more sockets in room, remove room or stop bots
                // if (this.rooms[roomId].sockets.size === 0) {
                //     this.stopAllBotsInRoom(roomId);
                //     delete this.rooms[roomId];
                // }
            }
        }
    }

    // --- Bot Instance Management ---
    addBotToRoom(roomId, botId) {
        console.log("Adding bot to room:", roomId, botId);
        console.log(`[addBotToRoom] ${this.rooms[roomId].bots[botId]}`);
        this.addRoom(roomId); // Ensure room exists
        if (!this.rooms[roomId].bots[botId]) {

            const aiPlayer = {
                id: botId,
                // name: `AI Bot ${botId}`,
                name: `STRONG AI BOT`,
                email: '',
                isAI: true,
                isOnline: true,
                score: 0
            }
            // this.allPlayers.push(new User(aiPlayer)); // Add AI player to global state
            this.allPlayers.push(aiPlayer);
            this.userSocketMap[botId] = null; // AI bots don't have a socket connection, but we keep the map consistent
            console.log("[aiBotManagers] allPlayers", this.allPlayers);

            this.rooms[roomId].bots[botId] = new AIBot(botId, roomId, aiPlayer, this.flaskApiUrl, this.io);

            roomManager.addPlayerToRoom(roomId, aiPlayer); // Add AI player to room in roomManager
            console.log(`[addBotToRoom] Bot ${botId} added to room ${roomId}.`);
            console.log(`[addBotToRoom] ${this.rooms[roomId].bots[botId]}`);
        }
    }

    removeBotFromRoom(roomId, botId) {
        console.log(`Removing bot ${botId} from room ${roomId}.`);
        if (this.rooms[roomId] && this.rooms[roomId].bots[botId]) {
            this.rooms[roomId].bots[botId].stopGuessing(); // Ensure bot stops its timer if any
            delete this.rooms[roomId].bots[botId];
            console.log(`Bot ${botId} removed from room ${roomId}.`);

            this.allPlayers = this.allPlayers.filter(player => player.id !== botId); // Remove AI player from global state
            delete this.userSocketMap[botId]; // Remove from userSocketMap
            roomManager.removePlayerFromRoom(roomId, botId); // Remove AI player from room in roomManager
        }
    }

    removeAllBotsFromRoom(roomId) {
        console.log(`Removing all bots from room ${roomId}.`);
        if (this.rooms[roomId]) {
            this.stopAllBotsInRoom(roomId); // Stop all bots before removing them
            for (const botId in this.rooms[roomId].bots) {
                this.removeBotFromRoom(roomId, botId);
            }
            this.rooms[roomId].bots = {}; // Clear the bots object
            console.log(`All bots removed from room ${roomId}.`);
        } else {
            console.log(`No bots found in room ${roomId}.`);
        }
    }

    getRoomIdByBotId(botId) {
        for (const roomId in this.rooms) {
            if (this.rooms[roomId].bots[botId]) {
                return roomId;
                return this.rooms[roomId]; // Return the room object containing the bot
            }
        }
        return null; // Bot not found in any room
    }

    startAllBotsInRoom(roomId) {
        console.log(`Starting all bots in room ${roomId}.`);
        if (this.rooms[roomId]) {
            for (const botId in this.rooms[roomId].bots) {
                console.log(`Starting bot ${botId} in room ${roomId}.`);
                this.rooms[roomId].bots[botId].startGuessing(); // Starts internal timer (if needed)
            }
        }
    }

    stopAllBotsInRoom(roomId) {
        console.log(`Stopping all bots in room ${roomId}.`);
        if (this.rooms[roomId]) {
            for (const botId in this.rooms[roomId].bots) {
                this.rooms[roomId].bots[botId].stopGuessing(); // Stops internal timer
            }
        }
    }

    // --- Canvas Update Processing (Main Trigger) ---
    processCanvasUpdate(roomId, dataUrl) {
        this.addRoom(roomId); // Ensure the room is initialized if this is the first update

        // Apply a cooldown to prevent sending predictions too frequently
        const lastPredictionTime = this.canvasUpdateCooldowns[roomId] || 0;
        const currentTime = Date.now();

        if (currentTime - lastPredictionTime < this.predictionIntervalMs) {
            // console.log(`Room ${roomId}: Cooldown active, skipping prediction for now.`);
            return; // Skip if less than 1 second has passed since last prediction request for this room
        }

        this.canvasUpdateCooldowns[roomId] = currentTime; // Update cooldown timestamp

        // Distribute the canvas update to all bots in the room
        for (const botId in this.rooms[roomId].bots) {
            const bot = this.rooms[roomId].bots[botId];
            console.log(`[AIBotManager] Processing canvas update for bot ${botId} in room ${roomId}.`);
            console.log(`[AIBotManager] ${this.rooms[roomId].bots[botId].isActiveInGame} ${this.rooms[roomId].bots[botId].isPredicting}`);
            // Here, the bot receives the *actual* dataUrl and can decide to process it
            // The bot itself will handle sending the request to Flask
            bot.receiveCanvasData(dataUrl);
        }
    }
}

// Ensure you instantiate this manager and pass `io` to it in server.js
const botManager = new AIBotManager();

module.exports = botManager; // Or export default AIBotManager;