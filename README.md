# Multiplayer Drawing Game

A real-time multiplayer drawing game built with React, TypeScript, and Vite.

## Features

- **Real-time Multiplayer Gameplay:**
    - Collaborative drawing on a synchronized canvas.
    - Instant updates for chat messages, scores, and game timers.
- **Game Room Management:**
    - Browse existing game rooms with current player count and status (waiting/in-progress).
    - Create new game rooms or join existing ones.
- **Interactive Game Interface:**
    - Dedicated drawing tools for the designated drawer (e.g., brush, eraser, color selection).
    - Guess input for other players.
    - Real-time display of player scores and a leaderboard.
- **User Authentication:** Secure player login and identification.
- **AI Bot Integration:** Bots can automatically join rooms to ensure games can proceed even with fewer players.
- **Turn-based Structure:** Clear indication of whose turn it is to draw and who is guessing.
- **Round End Summary:** Display of the correct answer after each round.

## Game Overview

This multiplayer drawing game revolves around two primary interfaces: the **Room List Page** and the **Game Page**.

### Room List Page

Upon starting, players land on the Room List Page. Here, they can:
- View all available game rooms, along with their current player count and status (e.g., "Waiting", "In Progress").
- Create a new game room.
- Join an existing room to participate.
- See their own user information (name, email, online status).

### Game Page

The Game Page is the heart of the game, where players draw and guess. Key elements include:
- **Synchronized Drawing Canvas:** All players see the drawing unfold in real-time.
- **Drawing Tools:** The designated drawer has access to tools like a brush, eraser, and color palette.
- **Guessing Area:** Other players submit their guesses here.
- **Chat Box:** For real-time communication and displaying game messages.
- **Timer:** Each round is timed to keep the game moving.
- **Topic Display:** Shown only to the current drawer.
- **Player List & Scores:** Displays all participants and their current scores.
- **Round End Information:** A modal appears at the end of each round, revealing the correct answer.

## User Flow

The following diagram illustrates the typical user journey through the game:

![User Flow Diagram](./userflow.png)

The general flow is as follows:
1.  **Entry:** Player starts the game and lands on the Room List page.
2.  **Room Selection/Creation:** Player either joins an existing game room or creates a new one.
3.  **Waiting Phase:** Players wait in the room until the game starts (e.g., enough players have joined).
4.  **Gameplay Loop (per round):**
    *   The system designates one player as the drawer.
    *   The drawer receives a topic and uses drawing tools to depict it on the canvas.
    *   Other players view the drawing in real-time and submit their guesses.
5.  **Scoring:** After each round, scores are updated based on correct guesses and drawing performance.
6.  **Next Round/Game End:** The game proceeds to the next round with a new drawer, or concludes if all rounds are complete, displaying final results.

## UI Wireframes

The following wireframes provide a visual guide to the main game interfaces:

### Room List Page

This wireframe shows the layout of the page where players can see and join available game rooms or create a new one.

![Room List Page Wireframe](./src/room_wireframe.png)

### Game Page

This wireframe illustrates the main game screen, including the drawing canvas, guessing area, chat, player list, and timer.

![Game Page Wireframe](./src/gaming_wire_frame.png)

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Socket.io (for real-time communication)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation and Setup

1. Clone the repository
   ```bash
   git clone https://github.com/fromtaoyuanhsinchuuuu/CNL-Final-Project.git
   cd CNL-Final-Project
   ```

2. Install dependencies
   ```bash
   npm install

   cd server
   npm install

   cd ../ai-server
   python -m pip install -r requirements.txt
   
   cd ../llm-server
   python -m pip install -r requirements.txt
   ```

3. **Start the backend server:**
   Open a new terminal window, navigate to the `server` directory, and run:
   ```bash
   cd server
   npm start
   ```
   You should see a message indicating the WebSocket server is running on port 3001.

4. **Start the frontend development server:**
   Open another terminal window, navigate to the project root directory (`CNL-Final-Project/`), and run:
   ```bash
   npm run dev
   ```

5. **Start the AI (CNN) Bot**
   Open another terminal window, navigate to the `ai-server` directory, and run:
   ```bash
   cd ai-server
   python app.py
   ```

6. **Start the LLM (Llama) Bot**
   Open another terminal window, navigate to the `llm-server` directory, and run:
   ```bash
   cd llm-server
   python app.py
   ```

7. The browser should automatically open to the application. If not, navigate to `http://localhost:5173` (or the url shown in your terminal).

### Troubleshooting

If you encounter any issues with the application not displaying or real-time features not working:

1. Clean the project and reinstall dependencies
   ```bash
   # Remove node_modules and dist folders in both frontend and backend
   rm -rf node_modules dist
   cd server
   rm -rf node_modules
   cd ..
   
   # Reinstall dependencies
   npm install
   cd server
   npm install
   cd ..
   
   # Start with force flag (for frontend)
   npm run dev -- --force
   ```

2. Check browser console (F12) for any error messages.

3. Check the backend terminal for any error messages or unexpected output.

4. Verify the `VITE_SOCKET_URL` in your `.env` file matches the backend server address and port.

5. If port 5173 (frontend) or 3001 (backend) is already in use, specify a different port:
   ```bash
   # For frontend:
   npm run dev -- --port 3000
   
   # For backend (modify server/index.js PORT or use environment variable):
   # PORT=4000 npm start
   ```

## Project Structure

- `/src` - Frontend source code
  - `/components` - Reusable UI components
  - `/contexts` - React context providers
  - `/pages` - Application pages
  - `/types` - TypeScript type definitions
- `/server` - Backend source code
  - `index.js` - Server entry point
  - `roomManager.js` - Room management logic
  - `gameManager.js` - Game logic
- `/ai-server` - AI bot server
   - `app.py` - flask server with AI bot logic using CNN
   - `quickdraw_model.h5` - Pre-trained CNN model for drawing recognition
- `/llm-server` - LLM bot server
   - `app.py` - flask server with LLM bot logic using Llama
   - `finetuned` - Fine-tuned Llama model files

## License

MIT
