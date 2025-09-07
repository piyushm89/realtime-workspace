import { useState, useEffect } from 'react';

export const useWorkspace = (roomId) => {
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!roomId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/api/workspace/${roomId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to load workspace data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setWorkspaceData(data.workspace);
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Error loading workspace:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [roomId]);

  const createWorkspace = async (name, owner) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}/api/workspace`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, owner }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.workspace;
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    workspaceData,
    loading,
    error,
    createWorkspace
  };
};
