const axios = require('axios');
// For TypeScript:
// import axios, { AxiosInstance } from 'axios';
// import { Server as SocketIOServer } from 'socket.io';

class AIBot {
    constructor(botId, roomId, user, flaskApiUrl, io) {
        this.botId = botId; // used as userId
        this.roomId = roomId;
        this.flaskApiUrl = flaskApiUrl;
        this.io = io; // Socket.IO server instance to emit guesses
        this.isPredicting = false; // Flag to prevent concurrent Flask requests
        this.lastPredictedClass = null; // To avoid repeating the same guess
        this.lastReceivedDataUrl = null; // Store the most recent dataUrl
        this.predictionRequestQueue = []; // For throttling/batching (advanced)

        // Bot state: A bot might only guess if the game is in a drawing phase
        this.isActiveInGame = false; // Controlled by `startGuessing` / `stopGuessing`

        // User
        this.user = user;
    }

    // Called by AIBotManager when a canvas update for its room is received
    receiveCanvasData(dataUrl) {
        console.log(`[AIBOT] ${this.isActiveInGame} ${this.isPredicting}`, )
        this.lastReceivedDataUrl = dataUrl;
        // Optionally, if the bot has an internal timer, it could be triggered here
        // or the manager directly calls makePrediction if no internal timer is used.
        if (this.isActiveInGame && !this.isPredicting) {
            console.log(`Bot ${this.botId} in room ${this.roomId} received canvas data, making prediction...`);
            this.makePrediction(); // Make prediction immediately if not already predicting
        }
    }

    startGuessing() {
        this.isActiveInGame = true;
        console.log(`Bot ${this.botId} in room ${this.roomId} is now active.`);
        // If the bot needs to initiate predictions on its own (e.g., if there's a delay from canvas updates)
        // this.predictionInterval = setInterval(() => this.makePrediction(), 1000); // Not strictly needed here given WebSocket trigger
    }

    stopGuessing() {
        this.isActiveInGame = false;
        this.isPredicting = false; // Ensure any pending requests are conceptually cancelled
        this.lastPredictedClass = null; // Reset for next round
        // clearInterval(this.predictionInterval); // Clear if internal timer was used
        console.log(`Bot ${this.botId} in room ${this.roomId} is now inactive.`);
    }

    async makePrediction() {
        if (this.isPredicting || !this.isActiveInGame || !this.lastReceivedDataUrl) {
            return; // Already predicting, inactive, or no data to predict
        }

        this.isPredicting = true;
        let predictionResult = { success: false, predicted_class: '...', probabilities: {} }; // Default placeholder

        try {
            console.log("flaskApiUrl", this.flaskApiUrl);
            const response = await axios.post(this.flaskApiUrl, {
                dataUrl: this.lastReceivedDataUrl
            }, {
                timeout: 1500 // Timeout for Flask response, ensuring it's within 2s total
            });

            if (response.data.success) {
                predictionResult = response.data;
                const { predicted_class, probabilities } = predictionResult;

                // probabilities is a dictionary: { class1: prob1, class2: prob2, ... }
                const confidence = Math.max(...Object.values(probabilities));

                // Decision logic: Only announce if guess changes or confidence is high enough
                if (predicted_class !== this.lastPredictedClass) { // Example threshold
                    this.lastPredictedClass = predicted_class;
                    // Emit the guess to all clients in the room via WebSocket
                    this.io.to(this.roomId).emit('aiGuess', {
                        botId: this.botId,
                        botUser: this.user,
                        guess: predicted_class,
                        confidence: confidence,
                        // Add any other relevant info like probabilities
                    });
                    console.log(`Bot ${this.botId} in Room ${this.roomId} guessed: ${predicted_class} (Conf: ${confidence.toFixed(2)})`);
                    // console.log(`Prediction result:`, predictionResult);

                    // **Integration Point: Notify Game Logic**
                    // If the Express.js backend needs to know about the guess for scoring/game state:
                    // this.io.to(this.roomId).emit('gameEvent', { type: 'botGuessed', botId: this.botId, guess: predicted_class });
                } else {
                    // Guess a random class if the prediction is the same as the last one
                    console.log("Guessing a random class due to repeated prediction:", predicted_class);
                    const randomClass = Object.keys(probabilities)[Math.floor(Math.random() * Object.keys(probabilities).length)];
                    this.lastPredictedClass = randomClass;
                }
            } else {
                console.error(`Flask prediction error for bot ${this.botId}:`, response.data.error);
                predictionResult.error = response.data.error;
            }

        } catch (error) {
            console.error(`Bot ${this.botId} prediction failed (Room ${this.roomId}):`, error.message);
            predictionResult.error = error.message;
        } finally {
            this.isPredicting = false;
            this.lastReceivedDataUrl = null; // Clear data after prediction
        }
    }
}

module.exports = AIBot; // Or export default AIBot;