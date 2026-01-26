import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import io, { Socket } from 'socket.io-client';
import { debounce } from 'lodash';
import { API_BASE_URL, WS_URL } from '@/config';
import type { Project } from '@/store/useStore';

export const useProject = (projectId: string | undefined) => {
  const { user } = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [version, setVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to keep track of state inside the socket callback
  const contentRef = useRef(content);
  const versionRef = useRef(version);

  useEffect(() => {
    contentRef.current = content;
    versionRef.current = version;
  }, [content, version]);

  // Initialize WebSocket
  useEffect(() => {
    if (!user?.id || !projectId) return;

    const newSocket = io(WS_URL, {
        transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('authenticate', { userId: user.id });
    });

    newSocket.on('authenticated', () => {
      console.log('Socket authenticated');
    });

    newSocket.on('sync:update', (data: any) => {
      if (data.projectId === projectId && data.socketId !== newSocket.id) {
        console.log('Received sync update', data);
        setContent(data.content);
        setWordCount(data.wordCount);
        setVersion(data.version);
        setLastSaved(new Date(data.updatedAt));
      }
    });

    newSocket.on('milestone:reached', (data: any) => {
      if (data.projectId === projectId) {
        // You can expose this event or handle it here
        console.log(`Milestone reached: ${data.milestone}!`);
      }
    });

    setSocket(newSocket);

    return () => {
        newSocket.close();
    };
  }, [user, projectId]);

  // Fetch project
  useEffect(() => {
    if (!user?.id || !projectId) return;

    const fetchProject = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                headers: { 'x-clerk-user-id': user.id }
            });
            const data = await res.json();
            
            if (data.success) {
                setProject(data.data.project);
                setContent(data.data.project.content || '');
                setWordCount(data.data.project.current_word_count || 0);
                setVersion(data.data.project.version || 0);
            } else {
                setError(data.message || 'Failed to load project');
            }
        } catch (err) {
            setError('Failed to load project');
            console.error(err);
        }
    };

    fetchProject();
  }, [user, projectId]);

  // Auto-save function
  const saveProject = async (newContent: string, newWordCount: number, currentVersion: number) => {
    if (!user?.id || !projectId) return;

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({
          content: newContent,
          word_count: newWordCount,
          version: currentVersion
        })
      });

      const data = await response.json();

      if (data.success) {
        const newVersion = data.data.project.version;
        setVersion(newVersion);
        setLastSaved(new Date());
        
        // Sync via WebSocket
        socket?.emit('sync:content', {
          projectId,
          content: newContent,
          wordCount: newWordCount,
          version: newVersion
        });
      } else if (data.error === 'VERSION_CONFLICT') {
        console.warn('Version conflict detected');
        // Handle conflict strategy (e.g., notify user or merge)
        // For now, let's just log it. A real app would show a modal.
        setError('Sync conflict detected. Please refresh.');
      }
    } catch (error) {
      console.error('Save failed:', error);
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((c: string, wc: number, v: number) => {
      saveProject(c, wc, v);
    }, 2000),
    [user, projectId, socket] // Dependencies for the creating the debounced function
  );

  // Update content handler
  const updateContent = (newContent: string) => {
    setContent(newContent);
    const words = newContent.split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    
    // We pass the *current* version to the save function
    // The server handles incrementing it
    debouncedSave(newContent, words, version);
  };

  const updateSettings = async (updates: Partial<Project>) => {
      if (!user?.id || !projectId) return;
      
      // Optimistic update
      setProject(prev => prev ? { ...prev, ...updates } : null);

      try {
          // We use the same endpoint for updates. 
          // Note: The backend expects specific fields. 
          // If updates contains word_goal, we send it.
          // If it contains title, we send it.
          const payload: any = {};
          if (updates.title) payload.title = updates.title;
          if (updates.goal) payload.word_goal = updates.goal; // Map to backend field
          if (updates.treeSpecies) payload.tree_species = updates.treeSpecies;
          if (updates.treeSeason) payload.tree_season = updates.treeSeason;

          await fetch(`${API_BASE_URL}/projects/${projectId}`, {
              method: 'PUT', // or PATCH if supported, backend uses PUT
              headers: { 
                  'Content-Type': 'application/json',
                  'x-clerk-user-id': user.id 
              },
              body: JSON.stringify(payload)
          });
      } catch (e) {
          console.error("Failed to update settings", e);
      }
  };

  return {
    project,
    content,
    wordCount,
    version,
    lastSaved,
    saving,
    error,
    updateContent,
    updateSettings,
    saveNow: () => saveProject(content, wordCount, version)
  };
};
