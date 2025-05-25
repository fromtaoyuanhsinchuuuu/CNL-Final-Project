import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Room, GameState, ChatMessage } from '../types';
import { io, Socket } from 'socket.io-client';

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

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
let socket: Socket | null = null;

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isDrawingTurn, setIsDrawingTurn] = useState(false);

  // 初始化 socket
  useEffect(() => {
    socket = io(SOCKET_URL);
    // 監聽 server 廣播
    socket.on('rooms', (serverRooms: Room[]) => setRooms(serverRooms));
    socket.on('players', (serverPlayers: User[]) => setPlayers(serverPlayers));
    socket.on('messages', (serverMessages: ChatMessage[]) => setMessages(serverMessages));
    socket.on('gameState', (serverGameState: GameState) => setGameState(serverGameState));
    socket.on('isDrawingTurn', (flag: boolean) => setIsDrawingTurn(flag));
    // ...可擴充更多事件
    return () => { socket?.disconnect(); };
  }, []);

  // Join a room
  const joinRoom = (roomId: string) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    } else {
      // fallback: mock
      const room = rooms.find(r => r.id === roomId);
      if (room && room.currentPlayers < room.maxPlayers) {
        setCurrentRoom(room);
        setPlayers(MOCK_PLAYERS);
        if (room.status === 'playing') {
          setGameState(initialGameState);
          setIsDrawingTurn(Math.random() > 0.5);
        }
      }
    }
  };

  // Create a new room
  const createRoom = (roomName: string) => {
    if (socket) {
      socket.emit('createRoom', roomName);
    } else {
      // fallback: mock
      const newRoom: Room = {
        id: `room-${Date.now()}`,
        name: roomName,
        currentPlayers: 1,
        maxPlayers: 8,
        status: 'waiting'
      };
      setRooms([...rooms, newRoom]);
      setCurrentRoom(newRoom);
      setPlayers([MOCK_PLAYERS[0]]);
    }
  };

  // Leave current room
  const leaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom');
    } else {
      setCurrentRoom(null);
      setPlayers([]);
      setMessages([]);
      setGameState(null);
      setIsDrawingTurn(false);
    }
  };

  // Send a message or guess
  const sendMessage = (content: string, isGuess = false) => {
    if (socket) {
      socket.emit('sendMessage', { content, isGuess });
    } else {
      // fallback: mock
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
      if (newMessage.isCorrectGuess) {
        setGameState(prev => {
          if (!prev) return prev;
          const newScores = { ...prev.scores };
          newScores['1'] = (newScores['1'] || 0) + 10;
          return { ...prev, scores: newScores };
        });
      }
    }
  };

  // Submit drawing
  const submitDrawing = (dataUrl: string) => {
    if (socket) {
      socket.emit('submitDrawing', dataUrl);
    } else {
      console.log('Drawing submitted', dataUrl.substring(0, 20) + '...');
    }
  };

  // Start the game
  const startGame = () => {
    if (socket) {
      socket.emit('startGame');
    } else {
      if (currentRoom) {
        const updatedRoom = { ...currentRoom, status: 'playing' as const };
        setCurrentRoom(updatedRoom);
        setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
        setGameState({
          ...initialGameState,
          currentDrawer: '1',
          currentWord: 'apple',
          scores: players.reduce((acc, player) => ({ ...acc, [player.id]: 0 }), {})
        });
        setIsDrawingTurn(true);
      }
    }
  };

  // End the current round
  const endRound = () => {
    if (socket) {
      socket.emit('endRound');
    } else if (gameState) {
      setGameState({
        ...gameState,
        isRoundOver: true,
        correctAnswer: gameState.currentWord || undefined
      });
    }
  }