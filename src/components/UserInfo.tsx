import React from 'react';
import { User } from '../types';
import { UserCircle } from 'lucide-react';

type UserInfoProps = {
  user: User;
  showEmail?: boolean;
  showScore?: boolean;
};

const UserInfo: React.FC<UserInfoProps> = ({ user, showEmail = true, showScore = false }) => {
  return (
    <div className="flex items-center">
      <div className="relative">
        <UserCircle className="h-8 w-8 text-gray-500" />
        <div className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      </div>
      <div className="ml-2">
        <div className="flex items-center">
          <p className="text-sm font-medium text-gray-900">
            {user.name}
            {user.isAI && <span className="ml-1 text-xs font-normal text-indigo-500">(AI)</span>}
          </p>
        </div>
        {showEmail && (
          <p className="text-xs text-gray-500">{user.email}</p>
        )}
      </div>
      {showScore && user.score !== undefined && (
        <div className="ml-auto bg-gray-100 px-2 py-1 rounded text-sm font-medium">
          {user.score}
        </div>
      )}
    </div>
  );
};

export default UserInfo;