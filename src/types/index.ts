export type User = {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  isAI?: boolean;
  score?: number;
};

export type Room = {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
};

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  isGuess?: boolean;
  isCorrectGuess?: boolean;
};

export type DrawingTool = 'pen' | 'eraser' | 'clear';

export type GameState = {
  currentDrawer: string | null;
  currentWord: string | null;
  timeRemaining: number;
  roundNumber: number;
  totalRounds: number;
  scores: Record<string, number>;
  currentCorrects: Record<string, boolean>;
  isRoundOver: boolean;
  correctAnswer?: string;
};