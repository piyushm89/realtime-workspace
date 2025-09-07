import React, { useState } from 'react';

const LibraryPanel = ({ onAddShape, isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('basic');

  const libraryItems = {
    basic: [
      { name: 'Rectangle', icon: '⬜', type: 'rectangle' },
      { name: 'Circle', icon: '⭕', type: 'ellipse' },
      { name: 'Diamond', icon: '💎', type: 'diamond' },
      { name: 'Triangle', icon: '🔺', type: 'triangle' },
      { name: 'Arrow', icon: '➡️', type: 'arrow' },
      { name: 'Line', icon: '📏', type: 'line' }
    ],
    flowchart: [
      { name: 'Process', icon: '⬜', type: 'process' },
      { name: 'Decision', icon: '💎', type: 'decision' },
      { name: 'Start/End', icon: '⭕', type: 'terminal' },
      { name: 'Document', icon: '📄', type: 'document' },
      { name: 'Database', icon: '🗄️', type: 'database' }
    ],
    uml: [
      { name: 'Class', icon: '📋', type: 'class' },
      { name: 'Actor', icon: '👤', type: 'actor' },
      { name: 'Use Case', icon: '⭕', type: 'usecase' },
      { name: 'Component', icon: '📦', type: 'component' }
    ],
    arrows: [
      { name: 'Simple Arrow', icon: '→', type: 'arrow-simple' },
      { name: 'Double Arrow', icon: '↔', type: 'arrow-double' },
      { name: 'Curved Arrow', icon: '↷', type: 'arrow-curved' },
      { name: 'Dashed Arrow', icon: '⤍', type: 'arrow-dashed' }
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 h-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Shape Library</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Categories */}
        <div className="flex border-b border-gray-200">
          {Object.keys(libraryItems).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                activeCategory === category
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Library Items */}
        <div className="p-4 overflow-y-auto h-64">
          <div className="grid grid-cols-3 gap-3">
            {libraryItems[activeCategory].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onAddShape(item);
                  onClose();
                }}
                className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300"
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs text-gray-600">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryPanel;
