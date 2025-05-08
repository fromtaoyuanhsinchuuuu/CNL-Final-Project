import React, { useEffect, useState } from 'react';

type TimerProps = {
  seconds: number;
  onTimeEnd?: () => void;
};

const Timer: React.FC<TimerProps> = ({ seconds, onTimeEnd }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  
  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeEnd?.();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onTimeEnd]);
  
  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const remainingSeconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  return (
    <div className="bg-white border border-gray-200 rounded-md p-2 text-center font-mono">
      <span className={`text-lg font-bold ${timeLeft < 10 ? 'text-red-600' : 'text-gray-900'}`}>
        {formattedTime}
      </span>
    </div>
  );
};

export default Timer;