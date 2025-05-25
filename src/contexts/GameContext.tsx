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

// 使用 import.meta.env 存取 Vite 暴露的環境變數，環境變數需以 VITE_ 為前綴
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
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
    console.log('Attempting to connect to socket server at', SOCKET_URL);

    socket.on('connect', () => {
      console.log('Socket connected!', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // 監聽 server 廣播
    socket.on('rooms', (serverRooms: Room[]) => {
      console.log('Received rooms update:', serverRooms);
      setRooms(serverRooms);
    });
    socket.on('players', (serverPlayers: User[]) => {
      console.log('Received players update:', serverPlayers);
      setPlayers(serverPlayers);
    });
    socket.on('messages', (serverMessages: ChatMessage[]) => {
      console.log('Received messages update:', serverMessages);
      setMessages(serverMessages);
    });
    socket.on('gameState', (serverGameState: GameState) => {
      console.log('Received gameState update:', serverGameState);
      setGameState(serverGameState);
    });
    socket.on('isDrawingTurn', (flag: boolean) => {
      console.log('Received isDrawingTurn update:', flag);
      setIsDrawingTurn(flag);
    });
    
    // 監聽成功加入房間事件
    socket.on('roomJoined', (room: Room) => {
      console.log('Successfully joined room:', room);
      setCurrentRoom(room);
      // 這裡不進行頁面跳轉，頁面跳轉由 RoomListPage 處理
    });

    // 監聽成功離開房間事件
    socket.on('leftRoom', () => {
      console.log('Successfully left room.');
      setCurrentRoom(null); // 將 currentRoom 設為 null，觸發 GamePage 導回 RoomListPage
    });

    // ...可擴充更多事件

    return () => { socket?.disconnect(); };
  }, []);

  // Join a room
  const joinRoom = (roomId: string) => {
    console.log('Emitting joinRoom', roomId);
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
    console.log('Emitting createRoom', roomName);
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
    console.log('Emitting leaveRoom');
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
    console.log('Emitting sendMessage', { content, isGuess });
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
    console.log('Emitting submitDrawing', dataUrl.substring(0, 20) + '...');
    if (socket) {
      socket.emit('submitDrawing', dataUrl);
    } else {
      console.log('Drawing submitted', dataUrl.substring(0, 20) + '...');
    }
  };

  // Start the game
  const startGame = () => {
    console.log('Emitting startGame');
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
    console.log('Emitting endRound');
    if (socket) {
      socket.emit('endRound');
    } else if (gameState) {
      setGameState({
        ...gameState,
        isRoundOver: true,
        correctAnswer: gameState.currentWord || undefined
      });
    }
  };

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

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};