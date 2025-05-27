import React from 'react';
import { User } from '../types';

type GameOverModalProps = {
    scores: Record<string, number>;
    players: User[];
    onClose: () => void;
    isVisible: boolean;
};

const GameOverModal: React.FC<GameOverModalProps> = ({ scores, players, onClose, isVisible }) => {
    if (!isVisible) return null;

    const sorted = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🎉 遊戲結束！</h2>

                <ul className="mb-6">
                    {sorted.map(player => (
                        <li key={player.id} className="text-gray-800 mb-1">
                            {player.name}: <span className="font-semibold">{scores[player.id] || 0}</span> 分
                        </li>
                    ))}
                </ul>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        回到大廳
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverModal;
