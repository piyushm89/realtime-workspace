import React, { useRef, useEffect, useState } from 'react';

const Canvas = ({ socket, workspaceData }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [shape, setShape] = useState('rectangle');
  const [startPoint, setStartPoint] = useState(null);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  const brushSizes = [2, 5, 10, 15, 20];
  const shapes = ['rectangle', 'circle', 'line', 'triangle'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set fixed size for testing
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
  }, []);

  const startDrawing = (e) => {
    console.log('🎨 Canvas mouse down detected!');
    e.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    console.log(`Starting to draw at: ${x}, ${y}`);
    
    const ctx = canvas.getContext('2d');
    
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Set proper drawing mode for eraser
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
      
      ctx.lineWidth = brushSize;
      
      // Draw immediate dot
      ctx.lineTo(x + 0.1, y + 0.1);
      ctx.stroke();
    }
    
    // Emit to socket if available
    if (socket) {
      const drawData = {
        type: 'start',
        x: x,
        y: y,
        tool,
        color,
        brushSize,
        shape: tool === 'shape' ? shape : undefined
      };
      socket.emit('draw-event', drawData);
      console.log('Emitted draw-event:', drawData);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Drawing to: ${x}, ${y}`);
    
    const ctx = canvas.getContext('2d');
    
    if (tool === 'pen' || tool === 'eraser') {
      // Set proper drawing mode for eraser
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
      
      ctx.lineWidth = brushSize;
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'shape' && startPoint) {
      // For shapes, we'll draw preview in stopDrawing
      // Here we could add live preview if needed
    }
    
    // Emit to socket if available
    if (socket && (tool === 'pen' || tool === 'eraser')) {
      const drawData = {
        type: 'draw',
        x: x,
        y: y,
        tool,
        color,
        brushSize
      };
      socket.emit('draw-event', drawData);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    
    console.log('🛑 Stop drawing');
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Handle shape drawing
    if (tool === 'shape' && startPoint && e) {
      const rect = canvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      drawShape(ctx, startPoint.x, startPoint.y, endX, endY, shape, color, brushSize);
      
      // Emit shape data to socket
      if (socket) {
        const shapeData = {
          type: 'shape',
          startX: startPoint.x,
          startY: startPoint.y,
          endX: endX,
          endY: endY,
          shape: shape,
          color: color,
          brushSize: brushSize
        };
        socket.emit('draw-event', shapeData);
      }
    }
    
    setStartPoint(null);
    
    // Emit to socket if available
    if (socket && tool !== 'shape') {
      const drawData = {
        type: 'end',
        tool,
        color,
        brushSize
      };
      socket.emit('draw-event', drawData);
    }
  };

  const drawShape = (ctx, startX, startY, endX, endY, shapeType, shapeColor, strokeWidth) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = shapeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    
    const width = endX - startX;
    const height = endY - startY;
    
    switch (shapeType) {
      case 'rectangle':
        ctx.rect(startX, startY, width, height);
        break;
      case 'circle':
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;
      case 'line':
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        break;
      case 'triangle':
        ctx.moveTo(startX + width / 2, startY);
        ctx.lineTo(startX, endY);
        ctx.lineTo(endX, endY);
        ctx.closePath();
        break;
      default:
        break;
    }
    
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (socket) {
      socket.emit('draw-event', { type: 'clear' });
    }
  };

  // Handle incoming draw events from other users
  useEffect(() => {
    if (!socket) return;

    const handleDrawEvent = (data) => {
      console.log('Received draw event:', data);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      
      if (data.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }
      
      if (data.type === 'shape') {
        drawShape(ctx, data.startX, data.startY, data.endX, data.endY, data.shape, data.color, data.brushSize);
        return;
      }
      
      // Handle pen and eraser
      if (data.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = data.color;
      }
      
      ctx.lineWidth = data.brushSize;
      
      if (data.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        ctx.lineTo(data.x + 0.1, data.y + 0.1);
        ctx.stroke();
      } else if (data.type === 'draw') {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
      }
    };

    socket.on('draw-event', handleDrawEvent);

    return () => {
      socket.off('draw-event', handleDrawEvent);
    };
  }, [socket]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-6 flex-wrap">
          {/* Tool Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Tool:</label>
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-1 rounded text-sm ${
                tool === 'pen'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              ✏️ Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-1 rounded text-sm ${
                tool === 'eraser'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              🧽 Eraser
            </button>
            <button
              onClick={() => setTool('shape')}
              className={`px-3 py-1 rounded text-sm ${
                tool === 'shape'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              🔷 Shapes
            </button>
          </div>

          {/* Shape Selection (only show when shape tool is selected) */}
          {tool === 'shape' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Shape:</label>
              {shapes.map((s) => (
                <button
                  key={s}
                  onClick={() => setShape(s)}
                  className={`px-2 py-1 rounded text-xs ${
                    shape === s
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {s === 'rectangle' && '⬜'}
                  {s === 'circle' && '⭕'}
                  {s === 'line' && '📏'}
                  {s === 'triangle' && '🔺'}
                  {' ' + s}
                </button>
              ))}
            </div>
          )}

          {/* Color Palette (hide for eraser) */}
          {tool !== 'eraser' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Color:</label>
              <div className="flex space-x-1">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded border-2 ${
                      color === c ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {tool === 'eraser' ? 'Eraser Size:' : 'Size:'}
            </label>
            <div className="flex space-x-1">
              {brushSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`px-2 py-1 rounded text-xs ${
                    brushSize === size
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600">{brushSize}px</span>
          </div>

          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-4 bg-gray-50 flex justify-center items-center">
        <div className="bg-white border-2 border-gray-300 rounded">
          <canvas
            ref={canvasRef}
            className="cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{
              display: 'block',
              cursor: tool === 'pen' ? 'crosshair' : 
                     tool === 'eraser' ? 'grab' :
                     tool === 'shape' ? 'copy' : 'crosshair'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Canvas;
