import React from 'react';
import { Room } from '../types';

type RoomListItemProps = {
  room: Room;
  onJoin: (roomId: string) => void;
};

const RoomListItem: React.FC<RoomListItemProps> = ({ room, onJoin }) => {
  const isFull = room.currentPlayers >= room.maxPlayers;
  const inProgress = room.status !== "waiting";
  const isDisabled = isFull || inProgress;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-900 truncate">{room.name}</p>
      </div>

      <div className="flex-shrink-0 text-sm text-gray-500 mr-4">
        {room.currentPlayers} / {room.maxPlayers}
      </div>

      <div className="flex-shrink-0 mr-4">
        <span className={`px-2 py-1 text-xs rounded-full ${
          room.status === 'waiting'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-purple-100 text-purple-800'
        }`}>
          {room.status === 'waiting' ? '等待中' : '進行中'}
        </span>
      </div>

      <button
        onClick={() => onJoin(room.id)}
        disabled={isDisabled}
        className={`px-4 py-2 text-sm rounded-md ${
          isDisabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
        }`}
      >
        {isFull ? '已滿' : inProgress ? '進行中' : '加入'}
      </button>
    </div>
  );
};

export default RoomListItem;
