const Workspace = require('../models/Workspace');
const { v4: uuidv4 } = require('uuid');

// Get workspace data
const getWorkspace = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    let workspace = await Workspace.findOne({ roomId });
    
    if (!workspace) {
      // Create new workspace if it doesn't exist
      workspace = new Workspace({
        roomId,
        owner: 'anonymous',
        name: `Workspace ${roomId.slice(0, 8)}`
      });
      await workspace.save();
    }
    
    res.json({
      success: true,
      workspace: {
        roomId: workspace.roomId,
        name: workspace.name,
        settings: workspace.settings,
        canvasData: workspace.canvasData,
        drawingHistory: workspace.drawingHistory.slice(-100), // Last 100 actions
        chatHistory: workspace.chatHistory.slice(-50) // Last 50 messages
      }
    });
  } catch (error) {
    console.error('Error getting workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new workspace
const createWorkspace = async (req, res) => {
  try {
    const { name, owner } = req.body;
    const roomId = uuidv4();
    
    const workspace = new Workspace({
      roomId,
      name: name || `Workspace ${roomId.slice(0, 8)}`,
      owner: owner || 'anonymous'
    });
    
    await workspace.save();
    
    res.json({
      success: true,
      workspace: {
        roomId: workspace.roomId,
        name: workspace.name,
        settings: workspace.settings
      }
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Save drawing action
const saveDrawingAction = async (roomId, drawingData) => {
  try {
    const workspace = await Workspace.findOne({ roomId });
    if (workspace) {
      workspace.drawingHistory.push({
        ...drawingData,
        timestamp: new Date()
      });
      
      // Keep only last 1000 drawing actions
      if (workspace.drawingHistory.length > 1000) {
        workspace.drawingHistory = workspace.drawingHistory.slice(-1000);
      }
      
      await workspace.save();
    }
  } catch (error) {
    console.error('Error saving drawing action:', error);
  }
};

// Save chat message
const saveChatMessage = async (roomId, messageData) => {
  try {
    const workspace = await Workspace.findOne({ roomId });
    if (workspace) {
      workspace.chatHistory.push({
        ...messageData,
        timestamp: new Date()
      });
      
      // Keep only last 200 chat messages
      if (workspace.chatHistory.length > 200) {
        workspace.chatHistory = workspace.chatHistory.slice(-200);
      }
      
      await workspace.save();
    }
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
};

// Save canvas data
const saveCanvasData = async (roomId, canvasData) => {
  try {
    await Workspace.findOneAndUpdate(
      { roomId },
      { canvasData },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving canvas data:', error);
  }
};

// Get workspace data (for socket handlers)
const getWorkspaceData = async (roomId) => {
  try {
    const workspace = await Workspace.findOne({ roomId });
    return workspace;
  } catch (error) {
    console.error('Error getting workspace data:', error);
    return null;
  }
};

// Update workspace name
const updateWorkspaceName = async (roomId, name) => {
  try {
    await Workspace.findOneAndUpdate(
      { roomId },
      { name },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error updating workspace name:', error);
    return false;
  }
};

// Update workspace settings
const updateWorkspaceSettings = async (roomId, settings) => {
  try {
    await Workspace.findOneAndUpdate(
      { roomId },
      { settings },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error updating workspace settings:', error);
    return false;
  }
};

// Get workspace analytics (optional)
const getWorkspaceAnalytics = async (req, res) => {
  try {
    const { roomId } = req.params;
    const workspace = await Workspace.findOne({ roomId });
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    const analytics = {
      totalDrawingActions: workspace.drawingHistory.length,
      totalChatMessages: workspace.chatHistory.length,
      createdAt: workspace.createdAt,
      lastActivity: workspace.updatedAt,
      // Add more analytics as needed
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error getting workspace analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getWorkspace,
  createWorkspace,
  saveDrawingAction,
  saveChatMessage,
  saveCanvasData,
  getWorkspaceData,
  updateWorkspaceName,
  updateWorkspaceSettings,
  getWorkspaceAnalytics
};
