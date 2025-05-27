import React from 'react';
import { useGame } from '../contexts/GameContext';

const GuessCanvas: React.FC = () => {
  const { canvasData } = useGame();

  // if (!canvasData) return <div>Waiting for drawing...</div>;
  // use all white for the initial state
    if (!canvasData) {
        return (
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8//8/AwAI/wH+5z3aAAAAAElFTkSuQmCC"
            alt="Waiting for drawing..."
            style={{ width: 600, height: 400, border: '1px solid gray' }}
        />
        </div>
        );
    }

  return (
    <img
      src={canvasData}
      alt="Live drawing"
      style={{ width: 600, height: 400, border: '1px solid gray' }}
    />
  );
};

export default GuessCanvas;
