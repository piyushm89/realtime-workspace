const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    default: 'Untitled Workspace'
  },
  owner: {
    type: String,
    required: true
  },
  collaborators: [{
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  canvasData: {
    type: String, // Base64 encoded canvas data
    default: ''
  },
  drawingHistory: [{
    type: {
      type: String,
      enum: ['start', 'draw', 'end', 'clear']
    },
    x: Number,
    y: Number,
    tool: String,
    color: String,
    brushSize: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: String
  }],
  chatHistory: [{
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  settings: {
    allowDrawing: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    allowVideoCall: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for better performance
workspaceSchema.index({ roomId: 1 });
workspaceSchema.index({ owner: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
