import React from 'react';

type RoundEndModalProps = {
  correctAnswer: string;
  onClose: () => void;
  isVisible: boolean;
};

const RoundEndModal: React.FC<RoundEndModalProps> = ({ 
  correctAnswer, 
  onClose,
  isVisible
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-900 mb-4">回合結束</h2>
        
        <p className="text-gray-700 mb-6">
          本回合結束，正確答案是：
          <span className="font-bold text-blue-600 ml-1">{correctAnswer}</span>
        </p>
      </div>
    </div>
  );
};

export default RoundEndModal;