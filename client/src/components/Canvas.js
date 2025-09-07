import React, { useRef, useEffect, useState, useCallback } from 'react';

const Canvas = ({ socket, workspaceData }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  const brushSizes = [2, 5, 10, 15, 20];

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
    
    console.log(`Starting to draw at: ${x}, ${y}`);
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    
    // Draw immediate dot
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    
    // Emit to socket if available
    if (socket) {
      const drawData = {
        type: 'start',
        x: x,
        y: y,
        tool,
        color,
        brushSize
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
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Emit to socket if available
    if (socket) {
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
    
    // Emit to socket if available
    if (socket) {
      const drawData = {
        type: 'end',
        tool,
        color,
        brushSize
      };
      socket.emit('draw-event', drawData);
    }
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
      
      ctx.strokeStyle = data.color;
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              🧽 Eraser
            </button>
          </div>

          {/* Color Palette */}
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

          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Size:</label>
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
              cursor: tool === 'pen' ? 'crosshair' : 'grab'
            }}
          />
        </div>
      </div>
    </div>
  );
};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const drawOnCanvas = useCallback((data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (data.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    // Set drawing properties
    ctx.globalCompositeOperation = data.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = data.tool === 'eraser' ? 'rgba(0,0,0,1)' : data.color;
    ctx.lineWidth = data.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (data.type === 'start') {
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      // Draw a small dot for single clicks
      ctx.lineTo(data.x + 0.1, data.y + 0.1);
      ctx.stroke();
    } else if (data.type === 'draw') {
      if (data.prevX !== undefined && data.prevY !== undefined) {
        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      } else {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
    } else if (data.type === 'end') {
      ctx.beginPath();
    }
  }, []);

  useEffect(() => {
    if (!workspaceData?.drawingHistory || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    workspaceData.drawingHistory.forEach((action) => {
      drawOnCanvas(action);
    });
  }, [workspaceData, drawOnCanvas]);

  useEffect(() => {
    if (!socket) return;

    socket.on('draw-event', (data) => {
      drawOnCanvas(data);
    });

    socket.on('canvas-clear', () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      socket.off('draw-event');
      socket.off('canvas-clear');
    };
  }, [socket, drawOnCanvas]);

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    console.log('Start drawing triggered'); // Debug log
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setLastPoint(point);

    const drawData = {
      type: 'start',
      x: point.x,
      y: point.y,
      tool,
      color,
      brushSize
    };

    drawOnCanvas(drawData);
    socket?.emit('draw-event', drawData);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    console.log('Drawing...'); // Debug log

    const point = getCanvasPoint(e);
    
    const drawData = {
      type: 'draw',
      x: point.x,
      y: point.y,
      prevX: lastPoint?.x,
      prevY: lastPoint?.y,
      tool,
      color,
      brushSize
    };

    setLastPoint(point);
    drawOnCanvas(drawData);
    socket?.emit('draw-event', drawData);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    console.log('Stop drawing'); // Debug log
    
    setIsDrawing(false);
    setLastPoint(null);

    const drawData = {
      type: 'end',
      tool,
      color,
      brushSize
    };

    socket?.emit('draw-event', drawData);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    socket?.emit('draw-event', {
      type: 'clear'
    });
  };

  const handleMouseMove = (e) => {
    if (isDrawing) {
      draw(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="bg-gray-100 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-6 flex-wrap">
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              🧽 Eraser
            </button>
          </div>

          {tool === 'pen' && (
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
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Size:</label>
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

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            startDrawing(e);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            handleMouseMove(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
          style={{
            cursor: tool === 'pen' ? 'crosshair' : 'pointer',
            touchAction: 'none'
          }}
        />
      </div>
    </div>
  );


export default Canvas;
