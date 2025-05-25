import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import RoomListItem from '../components/RoomListItem';
import UserInfo from '../components/UserInfo';
import { useGame } from '../contexts/GameContext';
import { useUser } from '../contexts/UserContext';

const RoomListPage: React.FC = () => {
  const { currentUser } = useUser();
  const { rooms, joinRoom, createRoom, currentRoom } = useGame();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();
  
  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
  };
  
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    createRoom(newRoomName);
    setIsCreatingRoom(false);
    setNewRoomName('');
  };
  
  // 在 currentRoom 狀態更新後進行頁面跳轉
  useEffect(() => {
    if (currentRoom) {
      navigate('/game');
    }
  }, [currentRoom, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">房間列表</h1>
          
          <button
            onClick={() => setIsCreatingRoom(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus size={18} className="mr-1" />
            創建新房間
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">用戶資訊</h2>
              <UserInfo user={currentUser} />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center text-sm text-gray-500 font-medium border-b border-gray-200 pb-2 mb-2">
                <div className="flex-1 mr-4">房間名稱</div>
                <div className="w-20 text-center">人數</div>
                <div className="w-20 text-center">狀態</div>
                <div className="w-20"></div>
              </div>
              
              {rooms.length > 0 ? (
                <div>
                  {rooms.map(room => (
                    <RoomListItem 
                      key={room.id} 
                      room={room} 
                      onJoin={handleJoinRoom} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-gray-500">目前沒有可加入的房間，請創建新房間</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Room Modal */}
      {isCreatingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">創建新房間</h2>
            
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                  房間名稱
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入房間名稱"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  創建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomListPage;