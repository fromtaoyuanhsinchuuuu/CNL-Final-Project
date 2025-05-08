import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DrawingCanvas from '../components/DrawingCanvas';
import ChatBox from '../components/ChatBox';
import PlayersList from '../components/PlayersList';
import Timer from '../components/Timer';
import RoundEndModal from '../components/RoundEndModal';
import { useGame } from '../contexts/GameContext';
import { useUser } from '../contexts/UserContext';

const GamePage: React.FC = () => {
  const { 
    currentRoom, 
    gameState, 
    players, 
    messages, 
    leaveRoom, 
    sendMessage, 
    submitDrawing,
    isDrawingTurn,
    startGame,
    endRound
  } = useGame();
  const { currentUser } = useUser();
  const [showRoundEndModal, setShowRoundEndModal] = useState(false);
  const navigate = useNavigate();
  
  // Redirect if no room is selected
  useEffect(() => {
    if (!currentRoom) {
      navigate('/');
    }
  }, [currentRoom, navigate]);
  
  // Show round end modal when round is over
  useEffect(() => {
    if (gameState?.isRoundOver) {
      setShowRoundEndModal(true);
    }
  }, [gameState?.isRoundOver]);
  
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };
  
  const handleNextRound = () => {
    setShowRoundEndModal(false);
    // In a real app, this would communicate with the server
    // For now, we'll just start a new "round" locally
    startGame();
  };

  const currentScore = gameState?.scores[currentUser.id] || 0;
  
  if (!currentRoom) return null;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={handleLeaveRoom}
              className="mr-3 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {gameState ? '遊戲進行中' : '等待中'}
            </h1>
          </div>
          
          {gameState && (
            <Timer 
              seconds={gameState.timeRemaining} 
              onTimeEnd={endRound}
            />
          )}
        </div>
        
        {!gameState ? (
          // Waiting room
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              等待其他玩家加入「{currentRoom.name}」
            </h2>
            <p className="text-gray-600 mb-6">
              已加入玩家: {currentRoom.currentPlayers} / {currentRoom.maxPlayers}
            </p>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleLeaveRoom}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  離開房間
                </button>
                
                {currentRoom.currentPlayers >= 2 && (
                  <button
                    onClick={startGame}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    開始遊戲
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Game in progress
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {isDrawingTurn && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 font-medium">
                    題目：<span className="ml-2">{gameState.currentWord}</span>
                  </p>
                </div>
              )}
              
              <DrawingCanvas 
                isDrawing={true} 
                onSubmit={submitDrawing}
                readOnly={!isDrawingTurn}
              />
              
              {!isDrawingTurn && (
                <div className="mt-6">
                  <ChatBox 
                    messages={messages}
                    onSendMessage={sendMessage}
                    canGuess={!isDrawingTurn}
                    currentScore={currentScore}
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <PlayersList 
                players={players}
                currentDrawerId={gameState.currentDrawer}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Round End Modal */}
      <RoundEndModal 
        correctAnswer={gameState?.correctAnswer || ''}
        onClose={handleNextRound}
        isVisible={showRoundEndModal}
      />
    </div>
  );
};

export default GamePage;