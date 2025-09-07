import React, { useRef, useEffect, useState, useCallback } from 'react';
import LibraryPanel from './LibraryPanel';
import ExportImportPanel from './ExportImportPanel';

const ExcalidrawCanvas = ({ socket, workspaceData }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('selection');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillStyle, setFillStyle] = useState('transparent');
  const [opacity, setOpacity] = useState(100);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [zoom, setZoom] = useState(100);
  const [startPoint, setStartPoint] = useState(null);
  const [currentShape, setCurrentShape] = useState('rectangle');
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [roughness, setRoughness] = useState(1);
  const [strokeStyle, setStrokeStyle] = useState('solid');
  const [arrowType, setArrowType] = useState('none');
  const [elements, setElements] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Undo/Redo state - moved here before useEffect
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Tools available
  const tools = [
    { name: 'selection', icon: '↖️', label: 'Select' },
    { name: 'hand', icon: '✋', label: 'Hand' },
    { name: 'rectangle', icon: '⬜', label: 'Rectangle' },
    { name: 'diamond', icon: '💎', label: 'Diamond' },
    { name: 'ellipse', icon: '⭕', label: 'Ellipse' },
    { name: 'arrow', icon: '➡️', label: 'Arrow' },
    { name: 'line', icon: '📏', label: 'Line' },
    { name: 'draw', icon: '✏️', label: 'Draw' },
    { name: 'text', icon: '📝', label: 'Text' },
    { name: 'image', icon: '🖼️', label: 'Image' },
    { name: 'eraser', icon: '🧽', label: 'Eraser' }
  ];

  // Colors
  const colors = [
    '#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00',
    '#e64980', '#7950f2', '#495057', '#ffffff', '#fab005'
  ];

  // Stroke widths
  const strokeWidths = [1, 2, 4, 8];

  // Fill styles
  const fillStyles = ['transparent', 'solid', 'hachure', 'cross-hatch'];

  // Font families
  const fontFamilies = ['Arial', 'Helvetica', 'Georgia', 'Times', 'Courier'];

  // Initialize canvas and keyboard shortcuts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 1200;
    canvas.height = 800;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Keyboard shortcuts
    const handleKeydown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'a':
            e.preventDefault();
            setTool('selection');
            break;
          case 'd':
            e.preventDefault();
            setTool('draw');
            break;
          case 't':
            e.preventDefault();
            setTool('text');
            break;
          case 'r':
            e.preventDefault();
            setTool('rectangle');
            break;
          case 'o':
            e.preventDefault();
            setTool('ellipse');
            break;
          case 'l':
            e.preventDefault();
            setTool('line');
            break;
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            // Delete selected elements logic
            break;
        }
      }
      
      // Single key shortcuts
      switch (e.key) {
        case 'v':
          setTool('selection');
          break;
        case 'h':
          setTool('hand');
          break;
        case 'Escape':
          setTool('selection');
          setIsTyping(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    console.log('Enhanced Canvas initialized with shortcuts');
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [historyIndex, history]);

  // Get canvas coordinates
  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  // Generate unique ID for elements
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Undo/Redo functionality
  const saveToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      redrawCanvas(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
      redrawCanvas(history[historyIndex + 1]);
    }
  };

  // Redraw canvas with elements
  const redrawCanvas = (elementsToRender) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    elementsToRender.forEach(element => {
      renderElement(ctx, element);
    });
  };

  // Render individual element
  const renderElement = (ctx, element) => {
    ctx.globalAlpha = (element.opacity || 100) / 100;
    
    switch (element.type) {
      case 'rectangle':
        drawRoughRectangle(ctx, element.startX, element.startY, 
          element.endX - element.startX, element.endY - element.startY, {
            strokeColor: element.color,
            fillColor: element.fillStyle === 'transparent' ? 'transparent' : element.color,
            strokeWidth: element.strokeWidth,
            roughness: element.roughness || 1
          });
        break;
      case 'ellipse':
        const centerX = (element.startX + element.endX) / 2;
        const centerY = (element.startY + element.endY) / 2;
        const radiusX = Math.abs(element.endX - element.startX) / 2;
        const radiusY = Math.abs(element.endY - element.startY) / 2;
        drawRoughEllipse(ctx, centerX, centerY, radiusX, radiusY, {
          strokeColor: element.color,
          fillColor: element.fillStyle === 'transparent' ? 'transparent' : element.color,
          strokeWidth: element.strokeWidth,
          roughness: element.roughness || 1
        });
        break;
      case 'text':
        ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y);
        break;
      // Add more element types as needed
    }
    
    ctx.globalAlpha = 1;
  };

  // Drawing functions
  const drawRoughRectangle = (ctx, x, y, width, height, options = {}) => {
    const { strokeColor = '#000', fillColor = 'transparent', strokeWidth = 2, roughness = 1 } = options;
    
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;
    
    if (roughness > 0) {
      // Add roughness effect
      const offset = roughness * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.random() * offset, y + Math.random() * offset);
      ctx.lineTo(x + width + Math.random() * offset, y + Math.random() * offset);
      ctx.lineTo(x + width + Math.random() * offset, y + height + Math.random() * offset);
      ctx.lineTo(x + Math.random() * offset, y + height + Math.random() * offset);
      ctx.closePath();
    } else {
      ctx.rect(x, y, width, height);
    }
    
    if (fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  };

  const drawRoughEllipse = (ctx, centerX, centerY, radiusX, radiusY, options = {}) => {
    const { strokeColor = '#000', fillColor = 'transparent', strokeWidth = 2, roughness = 1 } = options;
    
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;
    
    ctx.beginPath();
    if (roughness > 0) {
      // Rough ellipse approximation
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radiusX + (Math.random() - 0.5) * roughness * 2;
        const y = centerY + Math.sin(angle) * radiusY + (Math.random() - 0.5) * roughness * 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    }
    
    if (fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  };

  const drawArrow = (ctx, startX, startY, endX, endY, options = {}) => {
    const { strokeColor = '#000', strokeWidth = 2 } = options;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawDiamond = (ctx, centerX, centerY, width, height, options = {}) => {
    const { strokeColor = '#000', fillColor = 'transparent', strokeWidth = 2 } = options;
    
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - height / 2);
    ctx.lineTo(centerX + width / 2, centerY);
    ctx.lineTo(centerX, centerY + height / 2);
    ctx.lineTo(centerX - width / 2, centerY);
    ctx.closePath();
    
    if (fillColor !== 'transparent') ctx.fill();
    ctx.stroke();
  };

  // Event handlers
  const handleMouseDown = (e) => {
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStartPoint(point);

    if (tool === 'text') {
      setTextPosition(point);
      setIsTyping(true);
      return;
    }

    if (tool === 'draw') {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = opacity / 100;
    }

    // Emit start event
    if (socket) {
      socket.emit('draw-event', {
        type: 'start',
        tool,
        x: point.x,
        y: point.y,
        color,
        strokeWidth,
        opacity
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint) return;

    const point = getCanvasPoint(e);
    const ctx = canvasRef.current.getContext('2d');

    if (tool === 'draw') {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);

      if (socket) {
        socket.emit('draw-event', {
          type: 'draw',
          tool,
          x: point.x,
          y: point.y,
          color,
          strokeWidth,
          opacity
        });
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !startPoint) return;

    const point = getCanvasPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalAlpha = opacity / 100;

    const options = {
      strokeColor: color,
      fillColor: fillStyle === 'transparent' ? 'transparent' : color,
      strokeWidth,
      roughness
    };

    let elementData = {
      id: generateId(),
      type: tool,
      startX: startPoint.x,
      startY: startPoint.y,
      endX: point.x,
      endY: point.y,
      color,
      strokeWidth,
      fillStyle,
      opacity,
      roughness
    };

    switch (tool) {
      case 'rectangle':
        const width = point.x - startPoint.x;
        const height = point.y - startPoint.y;
        drawRoughRectangle(ctx, startPoint.x, startPoint.y, width, height, options);
        break;

      case 'ellipse':
        const centerX = (startPoint.x + point.x) / 2;
        const centerY = (startPoint.y + point.y) / 2;
        const radiusX = Math.abs(point.x - startPoint.x) / 2;
        const radiusY = Math.abs(point.y - startPoint.y) / 2;
        drawRoughEllipse(ctx, centerX, centerY, radiusX, radiusY, options);
        break;

      case 'diamond':
        const diamondCenterX = (startPoint.x + point.x) / 2;
        const diamondCenterY = (startPoint.y + point.y) / 2;
        const diamondWidth = Math.abs(point.x - startPoint.x);
        const diamondHeight = Math.abs(point.y - startPoint.y);
        drawDiamond(ctx, diamondCenterX, diamondCenterY, diamondWidth, diamondHeight, options);
        break;

      case 'arrow':
        drawArrow(ctx, startPoint.x, startPoint.y, point.x, point.y, options);
        break;

      case 'line':
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        break;

      case 'eraser':
        // Eraser logic handled in mousemove
        break;
    }

    // Add element to history
    if (tool !== 'draw' && tool !== 'eraser') {
      setElements(prev => [...prev, elementData]);
    }

    // Emit to socket
    if (socket && tool !== 'draw') {
      socket.emit('draw-event', {
        type: 'shape',
        ...elementData
      });
    }

    setIsDrawing(false);
    setStartPoint(null);
    ctx.globalAlpha = 1;
  };

  // Text handling
  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity / 100;
    ctx.fillText(textInput, textPosition.x, textPosition.y);
    ctx.globalAlpha = 1;

    const textElement = {
      id: generateId(),
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
      fontSize,
      fontFamily,
      color,
      opacity
    };

    setElements(prev => [...prev, textElement]);

    if (socket) {
      socket.emit('draw-event', {
        type: 'text',
        ...textElement
      });
    }

    setTextInput('');
    setIsTyping(false);
    setTextPosition(null);
  };

  // Clear canvas
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setElements([]);

    if (socket) {
      socket.emit('draw-event', { type: 'clear' });
    }
  };

  // Zoom functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 25));
  const handleZoomReset = () => setZoom(100);

  // Action buttons
  const actionButtons = [
    { name: 'library', icon: '📚', label: 'Library', onClick: () => setShowLibrary(true) },
    { name: 'export', icon: '📤', label: 'Export', onClick: () => setShowExportImport(true) },
    { name: 'undo', icon: '↶', label: 'Undo', onClick: handleUndo },
    { name: 'redo', icon: '↷', label: 'Redo', onClick: handleRedo }
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Main Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          {/* Left: Tools */}
          <div className="flex items-center space-x-1">
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => setTool(t.name)}
                className={`p-2 rounded-lg text-sm flex flex-col items-center min-w-[60px] ${
                  tool === t.name
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                title={t.label}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="text-xs mt-1">{t.label}</span>
              </button>
            ))}
            
            {/* Separator */}
            <div className="w-px h-12 bg-gray-300 mx-2"></div>
            
            {/* Action Buttons */}
            {actionButtons.map((btn) => (
              <button
                key={btn.name}
                onClick={btn.onClick}
                className="p-2 rounded-lg text-sm flex flex-col items-center min-w-[60px] bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                title={btn.label}
              >
                <span className="text-lg">{btn.icon}</span>
                <span className="text-xs mt-1">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Center: Canvas Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Elements: {elements.length}</span>
            <span>Canvas: 1200×800</span>
          </div>

          {/* Right: Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
              disabled={zoom <= 25}
            >
              −
            </button>
            <button
              onClick={handleZoomReset}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 min-w-[80px]"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
              disabled={zoom >= 300}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Properties Panel */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-8 flex-wrap">
          {/* Stroke Color */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Stroke:</label>
            <div className="flex space-x-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    color === c ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full border-2 border-gray-300 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Width:</label>
            <div className="flex space-x-1">
              {strokeWidths.map((width) => (
                <button
                  key={width}
                  onClick={() => setStrokeWidth(width)}
                  className={`px-3 py-1 rounded text-sm ${
                    strokeWidth === width
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {width}
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              className="w-16"
            />
            <span className="text-sm text-gray-600 min-w-[35px]">{strokeWidth}px</span>
          </div>

          {/* Fill Style */}
          {['rectangle', 'ellipse', 'diamond'].includes(tool) && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Fill:</label>
              <div className="flex space-x-1">
                {fillStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setFillStyle(style)}
                    className={`px-3 py-1 rounded text-sm capitalize ${
                      fillStyle === style
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {style === 'transparent' ? 'None' : 
                     style === 'hachure' ? 'Hatch' :
                     style === 'cross-hatch' ? 'Cross' : style}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stroke Style */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Style:</label>
            <select
              value={strokeStyle}
              onChange={(e) => setStrokeStyle(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>

          {/* Roughness */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Roughness:</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.5"
              value={roughness}
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
              className="w-16"
            />
            <span className="text-sm text-gray-600 min-w-[25px]">{roughness}</span>
          </div>

          {/* Font controls for text */}
          {tool === 'text' && (
            <>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Font:</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  {fontFamilies.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Size:</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="8"
                  max="72"
                />
              </div>
            </>
          )}

          {/* Opacity */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Opacity:</label>
            <input
              type="range"
              min="10"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 min-w-[35px]">{opacity}%</span>
          </div>

          {/* Clear button */}
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto bg-gray-100">
        <div className="p-8 flex justify-center">
          <div 
            className="bg-white shadow-lg"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-gray-300 cursor-crosshair"
              style={{
                cursor: tool === 'hand' ? 'grab' : 
                       tool === 'selection' ? 'default' :
                       tool === 'text' ? 'text' : 'crosshair'
              }}
            />
          </div>
        </div>
      </div>

      {/* Text Input Modal */}
      {isTyping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium mb-4">Add Text</h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-80 h-32 p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your text here..."
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setIsTyping(false);
                  setTextInput('');
                  setTextPosition(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTextSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Library Panel */}
      <LibraryPanel
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onAddShape={(shape) => {
          // Add shape to canvas at center
          const centerX = canvasRef.current.width / 2;
          const centerY = canvasRef.current.height / 2;
          const newElement = {
            id: generateId(),
            type: shape.type,
            startX: centerX - 50,
            startY: centerY - 25,
            endX: centerX + 50,
            endY: centerY + 25,
            color,
            strokeWidth,
            fillStyle,
            opacity,
            roughness
          };
          
          const newElements = [...elements, newElement];
          setElements(newElements);
          saveToHistory(newElements);
          redrawCanvas(newElements);
        }}
      />

      {/* Export/Import Panel */}
      <ExportImportPanel
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
        elements={elements}
        onExport={() => {}}
        onImport={(importedElements) => {
          const newElements = [...elements, ...importedElements];
          setElements(newElements);
          saveToHistory(newElements);
          redrawCanvas(newElements);
        }}
      />
    </div>
  );
};

export default ExcalidrawCanvas;
