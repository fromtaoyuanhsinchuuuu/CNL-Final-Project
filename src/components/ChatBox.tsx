import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

type ChatBoxProps = {
  messages: ChatMessage[];
  onSendMessage: (content: string, isGuess: boolean) => void;
  canGuess: boolean;
  currentScore?: number;
};

const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, 
  onSendMessage, 
  canGuess,
  currentScore
}) => {
  const [input, setInput] = useState('');
  const [isGuessMode, setIsGuessMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    onSendMessage(input, isGuessMode && canGuess);
    setInput('');
  };
  
  const toggleGuessMode = () => {
    if (canGuess) {
      setIsGuessMode(prev => !prev);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {currentScore !== undefined && (
        <div className="bg-gray-100 p-2 rounded-t-lg">
          <p className="text-sm font-medium text-gray-700">
            當前分數：<span className="text-blue-600 font-bold">{currentScore}</span>
          </p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 p-3 rounded-t-lg">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center italic">
            {canGuess ? "開始猜測或聊天吧！" : "等待其他玩家猜測..."}
          </p>
        ) : (
          messages.map(message => (
            <div 
              key={message.id}
              className={`mb-2 ${message.isCorrectGuess ? 'bg-green-100 p-2 rounded' : ''}`}
            >
              <div className="flex">
                <span className="font-medium text-sm text-gray-900">{message.userName}:</span>
                {message.isGuess && !message.isCorrectGuess && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded self-center">
                    猜測
                  </span>
                )}
                {message.isCorrectGuess && (
                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded self-center">
                    正確答案！
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{message.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="flex mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isGuessMode && canGuess ? "輸入你的猜測..." : "輸入聊天訊息..."}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isGuessMode && canGuess ? 'bg-blue-50' : 'bg-white'
          }`}
          disabled={!canGuess && isGuessMode}
        />
        
        {canGuess && (
          <button
            type="button"
            onClick={toggleGuessMode}
            className={`px-3 py-2 ${
              isGuessMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            猜測
          </button>
        )}
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
        >
          送出
        </button>
      </form>
    </div>
  );
};

export default ChatBox;