import React, { useState } from 'react';

const ExportImportPanel = ({ onExport, onImport, elements, isOpen, onClose }) => {
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(1);
  const [exportBackground, setExportBackground] = useState(true);

  const exportFormats = [
    { value: 'png', label: 'PNG Image' },
    { value: 'jpg', label: 'JPEG Image' },
    { value: 'svg', label: 'SVG Vector' },
    { value: 'json', label: 'JSON Data' },
    { value: 'pdf', label: 'PDF Document' }
  ];

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    switch (exportFormat) {
      case 'png':
      case 'jpg':
        const dataURL = canvas.toDataURL(`image/${exportFormat}`, exportQuality);
        const link = document.createElement('a');
        link.download = `drawing.${exportFormat}`;
        link.href = dataURL;
        link.click();
        break;
      
      case 'json':
        const jsonData = JSON.stringify(elements, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const jsonLink = document.createElement('a');
        jsonLink.download = 'drawing.json';
        jsonLink.href = url;
        jsonLink.click();
        URL.revokeObjectURL(url);
        break;
      
      case 'svg':
        // SVG export would require converting canvas to SVG
        alert('SVG export coming soon!');
        break;
      
      case 'pdf':
        alert('PDF export coming soon!');
        break;
    }
    
    onClose();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedElements = JSON.parse(e.target.result);
          onImport(importedElements);
          onClose();
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          onImport([{
            type: 'image',
            src: e.target.result,
            x: 50,
            y: 50,
            width: img.width,
            height: img.height
          }]);
          onClose();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Export / Import</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Export Section */}
          <div>
            <h4 className="text-md font-medium mb-3">Export Drawing</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {exportFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {(exportFormat === 'png' || exportFormat === 'jpg') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality: {Math.round(exportQuality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={exportQuality}
                      onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="exportBackground"
                      checked={exportBackground}
                      onChange={(e) => setExportBackground(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="exportBackground" className="text-sm text-gray-700">
                      Include background
                    </label>
                  </div>
                </>
              )}
              
              <button
                onClick={handleExport}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                📥 Export
              </button>
            </div>
          </div>
          
          {/* Import Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-md font-medium mb-3">Import File</h4>
            
            <div className="space-y-3">
              <input
                type="file"
                accept=".json,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleImport}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <p className="text-xs text-gray-500">
                Supported formats: JSON (drawing data), PNG, JPG (as image elements)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImportPanel;
