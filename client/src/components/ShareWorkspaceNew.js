import React, { useState, useEffect } from 'react';

const ShareWorkspace = ({ roomId, workspaceName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [inviteMethod, setInviteMethod] = useState('link');
  const [customMessage, setCustomMessage] = useState('');

  const shareUrl = `${window.location.origin}/workspace/${roomId}`;
  const defaultMessage = `Join me in "${workspaceName}" - a collaborative workspace where we can draw and chat together!`;

  useEffect(() => {
    setCustomMessage(defaultMessage);
  }, [workspaceName]);

  const copyToClipboard = async (text, type = 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join "${workspaceName}" - Collaborative Workspace`);
    const body = encodeURIComponent(`${customMessage}\n\n🔗 Click to join: ${shareUrl}\n\n📝 Or manually enter Room ID: ${roomId}\n\nLet's create something amazing together!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${customMessage}\n\n🔗 ${shareUrl}\n\n📝 Room ID: ${roomId}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`${customMessage} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(`Join "${workspaceName}"`);
    const summary = encodeURIComponent(customMessage);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`);
  };

  const generateQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    return qrUrl;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Share Workspace</h2>
              <p className="text-blue-100 mt-1">Invite others to collaborate in "{workspaceName}"</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Invite Method Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setInviteMethod('link')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === 'link'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔗 Share Link
            </button>
            <button
              onClick={() => setInviteMethod('social')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === 'social'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📱 Social Media
            </button>
            <button
              onClick={() => setInviteMethod('qr')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === 'qr'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📱 QR Code
            </button>
          </div>

          {/* Custom Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom invitation message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              placeholder="Add a personal message to your invitation..."
            />
          </div>

          {/* Content based on selected method */}
          {inviteMethod === 'link' && (
            <div className="space-y-4">
              {/* Direct Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Link
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl, 'link')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied === 'link'
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {copied === 'link' ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Room ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID (Alternative method)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={roomId}
                    readOnly
                    className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(roomId, 'roomId')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied === 'roomId'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {copied === 'roomId' ? '✓ Copied!' : 'Copy ID'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Others can join by entering this Room ID in the join form
                </p>
              </div>
            </div>
          )}

          {inviteMethod === 'social' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={shareViaEmail}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📧</span>
                  <span className="font-medium">Email</span>
                </button>
                
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">💚</span>
                  <span className="font-medium">WhatsApp</span>
                </button>
                
                <button
                  onClick={shareViaTwitter}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">🐦</span>
                  <span className="font-medium">Twitter</span>
                </button>
                
                <button
                  onClick={shareViaLinkedIn}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">💼</span>
                  <span className="font-medium">LinkedIn</span>
                </button>
              </div>
            </div>
          )}

          {inviteMethod === 'qr' && (
            <div className="text-center space-y-4">
              <p className="text-gray-600">Scan this QR code to join the workspace</p>
              <div className="flex justify-center">
                <img
                  src={generateQRCode()}
                  alt="QR Code for workspace"
                  className="border border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-500">
                Point your phone camera at the QR code to quickly join the workspace
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Sharing Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share the direct link for immediate access</li>
              <li>• Use Room ID for secure sharing in sensitive environments</li>
              <li>• QR codes work great for in-person sharing</li>
              <li>• Customize your message to provide context</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareWorkspace;
