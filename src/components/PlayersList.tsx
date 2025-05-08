import React from 'react';
import { User } from '../types';
import UserInfo from './UserInfo';

type PlayersListProps = {
  players: User[];
  currentDrawerId?: string | null;
};

const PlayersList: React.FC<PlayersListProps> = ({ players, currentDrawerId }) => {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = a.score !== undefined ? a.score : 0;
    const scoreB = b.score !== undefined ? b.score : 0;
    return scoreB - scoreA;
  });
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">玩家列表</h3>
      
      <div className="space-y-3">
        {sortedPlayers.map(player => (
          <div 
            key={player.id}
            className={`${currentDrawerId === player.id ? 'bg-yellow-50 p-2 -mx-2 rounded' : ''}`}
          >
            <UserInfo 
              user={player} 
              showEmail={false}
              showScore={true}
            />
            {currentDrawerId === player.id && (
              <span className="text-xs text-yellow-600 font-medium ml-10">
                正在繪圖中
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayersList;