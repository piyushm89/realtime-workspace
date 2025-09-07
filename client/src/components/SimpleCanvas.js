import React, { useRef, useEffect, useState } from 'react';

const SimpleCanvas = ({ socket, workspaceData }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Set a white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const startDrawing = (e) => {
    console.log('🎨 Start drawing!');
    alert('Canvas clicked! Drawing should work now.');
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Drawing at: ${x}, ${y}`);
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Test draw - immediate visual feedback
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x + 1, y + 1);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    console.log('✏️ Drawing...');
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    console.log('🛑 Stop drawing');
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

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

          {/* Clear Button */}
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-gray-50" style={{ minHeight: '500px' }}>
        <div className="text-center py-4 text-gray-600">
          Click and drag on the canvas below to draw
        </div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 border-2 border-blue-300 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            cursor: 'crosshair',
            backgroundColor: 'white',
            zIndex: 1,
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

export default SimpleCanvas;
