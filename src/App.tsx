import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RoomListPage from './pages/RoomListPage';
import GamePage from './pages/GamePage';
import { UserProvider } from './contexts/UserContext';
import { GameProvider } from './contexts/GameContext';

function App() {
  return (
    <UserProvider>
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RoomListPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </GameProvider>
    </UserProvider>
  );
}

export default App;