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
  const [prevPoint, setPrevPoint] = useState<{ x: number, y: number } | null>(null);

  const { sendCanvasUpdate } = useGame(); // Get from context
  
  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match its display size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set initial canvas state
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    
    // Fill with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);
  
  // Update brush properties when they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = tool === 'eraser' ? 'white' : brushColor;
    ctx.lineWidth = brushSize;
  }, [brushColor, brushSize, tool]);
  
  // Submit the drawing when needed
  const submitDrawing = () => {
    if (!canvasRef.current || !onSubmit) return;
    const dataUrl = canvasRef.current.toDataURL();
    sendCanvasUpdate(dataUrl);
    onSubmit(dataUrl);
  };
  
  // Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    submitDrawing();
  };
  
  // Draw line between two points
  const drawLine = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawingActive(true);
    setPrevPoint({ x, y });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingActive || !prevPoint || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    drawLine(prevPoint, currentPoint);
    setPrevPoint(currentPoint);

    submitDrawing();
  };
  
  const handleMouseUp = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawingActive(false);
    setPrevPoint(null);

    submitDrawing();
  };
  
  const handleMouseLeave = () => {
    if (!isDrawing || readOnly) return;
    setIsDrawingActive(false);
    setPrevPoint(null);
  };
  
  // Color options
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
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
          
          <div className="h-6 border-l border-gray-300 mx-2"></div>
          
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
          
          <div className="h-6 border-l border-gray-300 mx-2"></div>
          
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;