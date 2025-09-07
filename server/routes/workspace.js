const express = require('express');
const router = express.Router();
const {
  getWorkspace,
  createWorkspace,
  updateWorkspaceName,
  updateWorkspaceSettings,
  getWorkspaceAnalytics
} = require('../controllers/workspaceController');

// GET /api/workspace/:roomId - Get workspace data
router.get('/:roomId', getWorkspace);

// POST /api/workspace - Create new workspace
router.post('/', createWorkspace);

// PUT /api/workspace/:roomId/name - Update workspace name
router.put('/:roomId/name', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required'
      });
    }
    
    const success = await updateWorkspaceName(roomId, name.trim());
    
    if (success) {
      res.json({
        success: true,
        message: 'Workspace name updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update workspace name'
      });
    }
  } catch (error) {
    console.error('Error updating workspace name:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/workspace/:roomId/settings - Update workspace settings
router.put('/:roomId/settings', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { settings } = req.body;
    
    const success = await updateWorkspaceSettings(roomId, settings);
    
    if (success) {
      res.json({
        success: true,
        message: 'Workspace settings updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update workspace settings'
      });
    }
  } catch (error) {
    console.error('Error updating workspace settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/workspace/:roomId/analytics - Get workspace analytics
router.get('/:roomId/analytics', getWorkspaceAnalytics);

module.exports = router;
