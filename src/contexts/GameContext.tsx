import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Room, GameState, ChatMessage } from '../types';

type GameContextType = {
  rooms: Room[];
  messages: ChatMessage[];
  gameState: GameState | null;
  players: User[];
  joinRoom: (roomId: string) => void;
  createRoom: (roomName: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string, isGuess?: boolean) => void;
  submitDrawing: (dataUrl: string) => void;
  currentRoom: Room | null;
  startGame: () => void;
  endRound: () => void;
  isDrawingTurn: boolean;
};

// Initial game state
const initialGameState: GameState = {
  currentDrawer: null,
  currentWord: null,
  timeRemaining: 120,
  roundNumber: 0,
  totalRounds: 3,
  scores: {},
  isRoundOver: false
};

// Mock rooms data
const MOCK_ROOMS: Room[] = [
  { id: '1', name: 'Fun Room A', currentPlayers: 3, maxPlayers: 8, status: 'waiting' },
  { id: '2', name: 'Serious Players Only B', currentPlayers: 8, maxPlayers: 8, status: 'playing' },
  { id: '3', name: 'Beginners Welcome C', currentPlayers: 1, maxPlayers: 8, status: 'waiting' },
];

// Mock players data
const MOCK_PLAYERS: User[] = [
  { id: '1', name: 'Player', email: 'user@example.com', isOnline: true, score: 20 },
  { id: '2', name: 'Bob', email: 'bob@example.com', isOnline: true, score: 15 },
  { id: '3', name: 'Carol', email: 'carol@example.com', isOnline: true, score: 12 },
  { id: '4', name: 'Dave (AI)', email: 'dave@ai.com', isOnline: true, isAI: true, score: 8 },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isDrawingTurn, setIsDrawingTurn] = useState(false);

  // Join a room
  const joinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.currentPlayers < room.maxPlayers) {
      setCurrentRoom(room);
      setPlayers(MOCK_PLAYERS);
      
      // If room is already playing, set game state
      if (room.status === 'playing') {
        setGameState(initialGameState);
        // Randomly decide if it's user's turn to draw (for demo)
        setIsDrawingTurn(Math.random() > 0.5);
      }
    }
  };

  // Create a new room
  const createRoom = (roomName: string) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: roomName,
      currentPlayers: 1,
      maxPlayers: 8,
      status: 'waiting'
    };
    setRooms([...rooms, newRoom]);
    setCurrentRoom(newRoom);
    setPlayers([MOCK_PLAYERS[0]]); // Only the creator initially
  };

  // Leave current room
  const leaveRoom = () => {
    setCurrentRoom(null);
    setPlayers([]);
    setMessages([]);
    setGameState(null);
    setIsDrawingTurn(false);
  };

  // Send a message or guess
  const sendMessage = (content: string, isGuess = false) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: '1',
      userName: 'Player',
      content,
      timestamp: Date.now(),
      isGuess,
      isCorrectGuess: isGuess && gameState?.currentWord?.toLowerCase() === content.toLowerCase()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Handle correct guess
    if (newMessage.isCorrectGuess) {
      setGameState(prev => {
        if (!prev) return prev;
        const newScores = { ...prev.scores };
        newScores['1'] = (newScores['1'] || 0) + 10;
        return { ...prev, scores: newScores };
      });
    }
  };

  // Submit drawing (in real app would send to server)
  const submitDrawing = (dataUrl: string) => {
    console.log("Drawing submitted", dataUrl.substring(0, 20) + "...");
  };

  // Start the game
  const startGame = () => {
    if (currentRoom) {
      const updatedRoom = { ...currentRoom, status: 'playing' };
      setCurrentRoom(updatedRoom);
      setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      setGameState({
        ...initialGameState,
        currentDrawer: '1', // Set current user as the first drawer
        currentWord: 'apple', // Example word
        scores: players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
      });
      setIsDrawingTurn(true);
    }
  };

  // End the current round
  const endRound = () => {
    if (gameState) {
      setGameState({
        ...gameState,
        isRoundOver: true,
        correctAnswer: gameState.currentWord
      });
    }
  };

  // Effect to simulate timer countdown
  useEffect(() => {
    if (gameState && !gameState.isRoundOver) {
      const timer = setInterval(() => {
        setGameState(prev => {
          if (!prev) return prev;
          const newTimeRemaining = prev.timeRemaining - 1;
          
          // End round if time runs out
          if (newTimeRemaining <= 0) {
            clearInterval(timer);
            return { ...prev, timeRemaining: 0, isRoundOver: true };
          }
          
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState]);

  return (
    <GameContext.Provider value={{
      rooms,
      messages,
      gameState,
      players,
      joinRoom,
      createRoom,
      leaveRoom,
      sendMessage,
      submitDrawing,
      currentRoom,
      startGame,
      endRound,
      isDrawingTurn
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};