import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DrawingCanvas from '../components/DrawingCanvas';
import GuessCanvas from '../components/GuessCanvas';
import ChatBox from '../components/ChatBox';
import PlayersList from '../components/PlayersList';
import Timer from '../components/Timer';
import RoundEndModal from '../components/RoundEndModal';
import GameOverModal from '../components/GameOverModal';
import { useGame } from '../contexts/GameContext';
import { useUser } from '../contexts/UserContext';

const GamePage: React.FC = () => {
  const {
    currentRoom,
    gameState, // 遊戲狀態是否開始：0: waiting, 1: playing
    players,
    messages,
    leaveRoom,
    sendMessage,
    submitDrawing,
    isDrawingTurn,
    startGame
  } = useGame();
  const { currentUser } = useUser();
  const { isGameOver } = useGame();
  const [showRoundEndModal, setShowRoundEndModal] = useState(false);
  const [isBetweenRounds, setIsBetweenRounds] = useState(false);
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
      setIsBetweenRounds(true);

      // Hide modal and indicator before next round begins
      const timeout = setTimeout(() => {
        setShowRoundEndModal(false);
        setIsBetweenRounds(false);
      }, 9000); // 9 seconds before next round (game starts at 10s)

      return () => clearTimeout(timeout);
    }
  }, [gameState?.isRoundOver]);

  // auto-hide the modal before the next round
  useEffect(() => {
    if (showRoundEndModal) {
      const timeout = setTimeout(() => {
        setShowRoundEndModal(false);
      }, 10000); // auto close before server sends next round

      return () => clearTimeout(timeout);
    }
  }, [showRoundEndModal]);


  const handleLeaveRoom = () => {
    leaveRoom();
    // 頁面跳轉由 GameContext 中的 leftRoom 事件處理觸發
  };

  const handleNextRound = () => {
    setShowRoundEndModal(false); // Just close the modal — server will advance
  };

  // 判斷是否為房主 (簡易判斷：第一個加入房間的玩家)
  const isHost = players.length > 0 && currentUser?.id === players[0].id;
  // const isHost = true;
  console.log("[DEBUG]", currentUser, players, isHost);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 只有當 currentRoom 存在時才渲染遊戲內容 */}
        {currentRoom ? (
          <>
            <div className="flex items-center mb-6">
              <button onClick={handleLeaveRoom} className="mr-4 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{currentRoom.status === 'waiting' ? '等待中' : '遊戲中'}</h1>
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
                    {/* Start Game Button */}
                    {currentRoom?.status === 'waiting' && isHost && (
                      <button
                        onClick={startGame}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-full"
                      >
                        開始遊戲
                      </button>
                    )}

                    {/* Leave Room Button */}
                    <button
                      onClick={handleLeaveRoom}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-full"
                    >
                      離開房間
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Game in progress
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {isBetweenRounds && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
                      <div className="bg-white px-6 py-4 rounded-lg shadow-lg animate-fade-in">
                        <p className="text-lg font-semibold text-gray-800">
                          下一回合即將開始…
                        </p>
                      </div>
                    </div>
                  )}
                  <Timer key={gameState.roundNumber} seconds={gameState.timeRemaining}>
                  </Timer>
                  {isDrawingTurn && gameState.currentWord && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 font-medium">
                        題目：<span className="ml-2">{gameState.currentWord}</span>
                      </p>
                    </div>
                  )}
                  
                  {!isDrawingTurn && (
                    <GuessCanvas />
                  )}

                  {isDrawingTurn && (
                    <DrawingCanvas 
                      isDrawing={true} 
                      onSubmit={submitDrawing}
                      readOnly={!isDrawingTurn}
                    />
                  )}
                  
                  {!isDrawingTurn && (
                    <div className="mt-6">
                      <ChatBox
                        messages={messages}
                        onSendMessage={sendMessage}
                        canGuess={!isDrawingTurn}
                      // currentScore={currentScore} // 移除未定義的 currentScore
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
          </>
        ) : (
          // 如果 currentRoom 為 null，顯示載入或其他提示，或直接由 useEffect 導航
          <div>載入中...</div>
        )}
      </div>

      {/* Round End Modal */}
      <RoundEndModal
        correctAnswer={gameState?.correctAnswer || ''}
        onClose={handleNextRound}
        isVisible={showRoundEndModal}
      />
      <GameOverModal
        isVisible={isGameOver}
        onClose={() => {
          setShowRoundEndModal(false);
          // TODO: currently unfunctional
          navigate('/'); // back to lobby
        }}
        scores={gameState?.scores || {}}
        players={players}
      />
    </div>
  );
};

export default GamePage;