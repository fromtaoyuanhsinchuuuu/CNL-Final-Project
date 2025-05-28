import React, { useRef, useState, useEffect } from 'react';
import { DrawingTool } from '../types';
import { Eraser, Pencil, Trash2 } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

type DrawingCanvasProps = {
  isDrawing: boolean;
  onSubmit?: (dataUrl: string) => void;
  readOnly?: boolean;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  onSubmit,
  readOnly = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [prevPoint, setPrevPoint] = useState<{ x: number; y: number } | null>(null);
  const { sendCanvasUpdate } = useGame();

  // Init canvas once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Make sure touch doesn’t pan/zoom the canvas
    canvas.style.touchAction = 'none';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Update brush/eraser settings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = tool === 'eraser' ? 'white' : brushColor;
    ctx.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);

  const submitDrawing = () => {
    if (!canvasRef.current || !onSubmit) return;
    const dataUrl = canvasRef.current.toDataURL();
    sendCanvasUpdate(dataUrl);
    onSubmit(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    submitDrawing();
  };

  const drawLine = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    setIsDrawingActive(true);
    setPrevPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingActive || !prevPoint || readOnly) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawLine(prevPoint, current);
    setPrevPoint(current);
    submitDrawing();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current!;
    canvas.releasePointerCapture(e.pointerId);
    setIsDrawingActive(false);
    setPrevPoint(null);
    submitDrawing();
  };

  const handlePointerLeave = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawingActive(false);
    setPrevPoint(null);
  };

  const colorOptions = [
    '#000000', '#ff0000', '#0000ff', '#008000',
    '#ffa500', '#800080', '#a52a2a', '#ffff00'
  ];

  return (
    <div className="flex flex-col">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-64 touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
      </div>

      {isDrawing && !readOnly && (
        <div className="mt-2 flex items-center justify-start space-x-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <Pencil size={20} className={tool === 'pen' ? 'text-blue-600' : 'text-gray-600'} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <Eraser size={20} className={tool === 'eraser' ? 'text-blue-600' : 'text-gray-600'} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            <Trash2 size={20} className="text-gray-600" />
          </button>
          <div className="h-6 border-l border-gray-300 mx-2" />
          <div className="flex space-x-1">
            {colorOptions.map(color => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-6 h-6 rounded-full ${brushColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="h-6 border-l border-gray-300 mx-2" />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={e => setBrushSize(+e.target.value)}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;
