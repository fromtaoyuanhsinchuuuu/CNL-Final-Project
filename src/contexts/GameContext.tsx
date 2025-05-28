import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Room, GameState, ChatMessage } from '../types';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext'; // Import useUser

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
  isDrawingTurn: boolean;
  canvasData: string | null;
  sendCanvasUpdate: (dataUrl: string) => void;
  isGameOver: boolean;
};

// Initial game state
const initialGameState: GameState = {
  currentDrawer: null,
  currentWord: null,
  timeRemaining: 120,
  roundNumber: 0,
  totalRounds: 3,
  scores: {},
  currentCorrects: {},
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
// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:3001`;
// let socket: Socket | null = null;

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateUser } = useUser(); // Access currentUser from UserContext

  const socketRef = React.useRef<Socket | null>(null);
  const currentRoomRef = React.useRef<Room | null>(null);

  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isDrawingTurn, setIsDrawingTurn] = useState(false);

  // shared canvas
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // 初始化 socket
  useEffect(() => {

    // if (!currentUser) {
    //   console.error('No current user found, cannot initialize socket.');
    //   return;
    // }
    const shouldConnect = !socketRef.current?.connected;
    const shouldDisconnect = socketRef.current?.connected;

    if (shouldConnect) {

      if (socketRef.current) {
        console.log('[Client] Socket already exists, disconnecting previous instance.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // This automatically uses whatever host the page was loaded from
      const newSocket = io(SOCKET_URL, {
        // send initial user info if needed
        // query: { userId: currentUser.userId }, // 傳送當前用戶 ID
        // transports: ['websocket'], // 使用 WebSocket 傳輸
        // autoConnect: false, // 不自動連接，手動控制連接時機
      });

      console.log('Attempting to connect to socket server at', SOCKET_URL);

      newSocket.on('connect', () => {
        console.log('Socket connected!', newSocket?.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        socketRef.current = null;
      });

      newSocket.on('userId', (assignedUserId: string) => {
        console.log('Received userId from server:', assignedUserId);
        updateUser({
          id: assignedUserId
        });
      });

      // 監聽 server 廣播
      newSocket.on('rooms', (serverRooms: Room[]) => {
        setRooms(serverRooms);
        const current = currentRoomRef.current;
        if (current) {
          const updatedRoom = serverRooms.find(r => r.id === current.id);
          if (updatedRoom) {
            setCurrentRoom(updatedRoom);
          } else {
            setCurrentRoom(null);
          }
        }
      });
      newSocket.on('players', (serverPlayers: User[]) => {
        console.log('Received players update:', serverPlayers);
        setPlayers(serverPlayers);
      });
      newSocket.on('messages', (serverMessages: ChatMessage[]) => {
        console.log('Received messages update:', serverMessages);
        setMessages(serverMessages);
      });
      newSocket.on('gameState', (serverGameState: GameState) => {
        console.log('Received gameState update:', serverGameState);
        setGameState(serverGameState);
      });
      newSocket.on('isDrawingTurn', (flag: boolean) => {
        console.log('Received isDrawingTurn update:', flag);
        setIsDrawingTurn(flag);
      });

      // 監聽成功加入房間事件
      newSocket.on('roomJoined', (room: Room) => {
        console.log('Successfully joined room:', room);
        setCurrentRoom(room);
        // 這裡不進行頁面跳轉，頁面跳轉由 RoomListPage 處理
      });

      // 監聽成功離開房間事件
      newSocket.on('leftRoom', () => {
        console.log('Successfully left room.');
        setCurrentRoom(null); // 將 currentRoom 設為 null，觸發 GamePage 導回 RoomListPage
      });

      // 監聽繪圖更新事件
      newSocket.on('canvasUpdate', (dataUrl: string) => {
        setCanvasData(dataUrl);
      });


      // ...可擴充更多事件
      // Gameover
      newSocket.on('gameOver', (finalState: GameState) => {
        console.log('Game over!', finalState);
        setGameState(finalState);
        setIsGameOver(true);
      });


      // set socketRef
      socketRef.current = newSocket;

      return () => {
        if (socketRef.current) {
          console.log('[Client] Disconnecting socket...');
          console.log("This is on useEffect cleanup");
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        // newSocket?.disconnect();
      };

    } else if (shouldDisconnect) {
      console.log('[Client] Disconnecting socket...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

  }, []); // 依賴 currentUser，當用戶登錄或登出時重新初始化 socket

  const getSocket = useCallback(() => socketRef.current, []);

  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    console.log('Emitting joinRoom', roomId);
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('joinRoom', roomId);
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
  }, [getSocket]);

  // Create a new room
  const createRoom = useCallback((roomName: string) => {
    console.log('Emitting createRoom', roomName);
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('createRoom', roomName);
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
  }, [getSocket]);

  // Leave current room
  const leaveRoom = useCallback(() => {
    console.log('Emitting leaveRoom');
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('leaveRoom');
    } else {
      setCurrentRoom(null);
      setPlayers([]);
      setMessages([]);
      setGameState(null);
      setIsDrawingTurn(false);
    }
  }, [getSocket]);

  // Send a message or guess
  const sendMessage = useCallback((content: string, isGuess = false) => {
    console.log('Emitting sendMessage', { content, isGuess });
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('sendMessage', { content, isGuess });
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
  }, [getSocket]);

  // Submit drawing
  const submitDrawing = useCallback((dataUrl: string) => {
    console.log('Emitting submitDrawing', dataUrl.substring(0, 20) + '...');
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('submitDrawing', dataUrl);
    } else {
      console.log('Drawing submitted', dataUrl.substring(0, 20) + '...');
    }
  }, [getSocket]);

  // Start the game
  const startGame = useCallback(() => {
    console.log('Emitting startGame');
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('startGame');
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
  }, [getSocket]);

  const sendCanvasUpdate = useCallback((dataUrl: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('canvasUpdate', dataUrl);
    }
  }, [getSocket]);


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
      isDrawingTurn,
      canvasData,
      sendCanvasUpdate,
      isGameOver
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