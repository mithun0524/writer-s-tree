# Writer's Tree - Complete Backend API Documentation

**Base URL:** `http://localhost:3000/api/v1` (Development)  
**Production URL:** `https://api.writerstree.com/api/v1`

**Last Updated:** January 25, 2026  
**API Version:** v1

---

## Table of Contents

1. [Authentication](#authentication)
2. [Projects API](#projects-api)
3. [Analytics API](#analytics-api)
4. [Suggestions API](#suggestions-api)
5. [WebSocket Events](#websocket-events)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Frontend Integration Guide](#frontend-integration-guide)

---

## Authentication

All API requests require Clerk authentication via header:

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-clerk-user-id': 'user_xxxxxxxxxxxxx' // From Clerk session
}
```

### Getting User ID from Clerk (Frontend)

```javascript
import { useUser } from '@clerk/clerk-react';

function YourComponent() {
  const { user } = useUser();
  const userId = user?.id; // This is what you send as x-clerk-user-id
}
```

---

## Projects API

### 1. Get All Projects

**GET** `/projects`

Retrieves all projects for the authenticated user.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by status: `active`, `completed`, `archived` |
| limit | integer | No | 50 | Number of results (max 100) |
| offset | integer | No | 0 | Pagination offset |

**Frontend Example:**
```javascript
const fetchProjects = async (userId, status = null) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const response = await fetch(`http://localhost:3000/api/v1/projects?${params}`, {
    headers: {
      'x-clerk-user-id': userId
    }
  });
  
  const data = await response.json();
  return data.data.projects;
};

// Usage in React
const [projects, setProjects] = useState([]);
useEffect(() => {
  if (user?.id) {
    fetchProjects(user.id, 'active').then(setProjects);
  }
}, [user]);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "user_id": "1",
        "title": "My Novel",
        "word_goal": 50000,
        "current_word_count": 15230,
        "tree_seed": "random_seed_123",
        "tree_species": "oak",
        "tree_season": "spring",
        "status": "active",
        "created_at": "2026-01-20T10:00:00.000Z",
        "updated_at": "2026-01-25T09:00:00.000Z",
        "last_edited_at": "2026-01-25T09:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  }
}
```

---

### 2. Create Project

**POST** `/projects`

Creates a new writing project.

**Request Body:**
```json
{
  "title": "My Novel",
  "word_goal": 50000,
  "tree_species": "oak",
  "tree_season": "spring"
}
```

**Frontend Example:**
```javascript
const createProject = async (userId, projectData) => {
  const response = await fetch('http://localhost:3000/api/v1/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId
    },
    body: JSON.stringify({
      title: projectData.title,
      word_goal: projectData.wordGoal,
      tree_species: projectData.species || 'oak',
      tree_season: projectData.season || 'spring'
    })
  });
  
  return await response.json();
};

// Usage in React form
const handleCreateProject = async (e) => {
  e.preventDefault();
  const result = await createProject(user.id, {
    title: formData.title,
    wordGoal: 50000
  });
  
  if (result.success) {
    navigate(`/project/${result.data.project.id}`);
  }
};
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "uuid",
      "title": "My Novel",
      "word_goal": 50000,
      "current_word_count": 0,
      "tree_seed": "generated_seed",
      "tree_species": "oak",
      "tree_season": "spring",
      "status": "active"
    }
  }
}
```

---

### 3. Get Single Project

**GET** `/projects/:projectId`

**Frontend Example:**
```javascript
const fetchProject = async (userId, projectId) => {
  const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
    headers: {
      'x-clerk-user-id': userId
    }
  });
  
  return await response.json();
};

// Usage in React
const [project, setProject] = useState(null);
useEffect(() => {
  if (user?.id && projectId) {
    fetchProject(user.id, projectId).then(data => {
      setProject(data.data.project);
    });
  }
}, [user, projectId]);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "title": "My Novel",
      "content": "Chapter 1...",
      "word_goal": 50000,
      "current_word_count": 15230,
      "tree_species": "oak",
      "tree_season": "spring",
      "status": "active"
    }
  }
}
```

---

### 4. Update Project

**PUT** `/projects/:projectId`

Updates project title, settings, or content.

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Full project content...",
  "word_count": 15500,
  "version": 42
}
```

**Frontend Example (Auto-save):**
```javascript
import { debounce } from 'lodash';

const saveProject = async (userId, projectId, content, wordCount, version) => {
  const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId
    },
    body: JSON.stringify({
      content,
      word_count: wordCount,
      version
    })
  });
  
  return await response.json();
};

// Auto-save with debounce (waits 2 seconds after user stops typing)
const debouncedSave = useCallback(
  debounce((content, wordCount, version) => {
    saveProject(user.id, projectId, content, wordCount, version)
      .then(data => {
        if (data.success) {
          setLastSaved(new Date());
          setVersion(data.data.project.version);
        }
      });
  }, 2000),
  [user, projectId]
);

// Call on every content change
const handleContentChange = (newContent) => {
  setContent(newContent);
  const words = newContent.split(/\s+/).filter(Boolean).length;
  setWordCount(words);
  debouncedSave(newContent, words, version);
};
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {
      "id": "uuid",
      "content": "Updated content...",
      "current_word_count": 15500,
      "version": 43,
      "updated_at": "2026-01-25T09:30:00.000Z"
    }
  }
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "error": "VERSION_CONFLICT",
  "message": "Content has been modified by another session",
  "data": {
    "serverVersion": 44,
    "clientVersion": 42,
    "serverContent": "Latest content from server..."
  }
}
```

---

### 5. Delete Project

**DELETE** `/projects/:projectId`

**Query Parameters:**
- `permanent=true` - Permanently delete (default: soft delete/archive)

**Frontend Example:**
```javascript
const deleteProject = async (userId, projectId, permanent = false) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/projects/${projectId}?permanent=${permanent}`,
    {
      method: 'DELETE',
      headers: {
        'x-clerk-user-id': userId
      }
    }
  );
  
  return await response.json();
};

// Usage with confirmation
const handleDelete = () => {
  if (confirm('Are you sure you want to delete this project?')) {
    deleteProject(user.id, projectId).then(() => {
      navigate('/dashboard');
    });
  }
};
```

---

### 6. Export Project

**POST** `/projects/:projectId/export`

Exports project content in various formats.

**Request Body:**
```json
{
  "format": "docx",
  "includeMetadata": true
}
```

**Formats:** `txt`, `docx`, `pdf`

**Frontend Example:**
```javascript
const exportProject = async (userId, projectId, format) => {
  const response = await fetch(
    `http://localhost:3000/api/v1/projects/${projectId}/export`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clerk-user-id': userId
      },
      body: JSON.stringify({
        format,
        includeMetadata: true
      })
    }
  );
  
  // For TXT format, response is text
  if (format === 'txt') {
    const text = await response.text();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}.txt`;
    a.click();
    return;
  }
  
  // For DOCX/PDF, response is binary
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectTitle}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};

// Usage in button
<button onClick={() => exportProject(user.id, projectId, 'docx')}>
  Export as DOCX
</button>
```

---

## Analytics API

### 1. Get User Statistics

**GET** `/analytics/stats`

**Query Parameters:**
- `period` - `week`, `month`, `year`

**Frontend Example:**
```javascript
const fetchStats = async (userId, period = 'month') => {
  const response = await fetch(
    `http://localhost:3000/api/v1/analytics/stats?period=${period}`,
    {
      headers: {
        'x-clerk-user-id': userId
      }
    }
  );
  
  return await response.json();
};

// Usage in dashboard
const [stats, setStats] = useState(null);
useEffect(() => {
  if (user?.id) {
    fetchStats(user.id, 'month').then(data => {
      setStats(data.data.stats);
    });
  }
}, [user]);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalProjects": 5,
      "completedProjects": 2,
      "totalWordsWritten": 125430,
      "currentStreak": 7,
      "milestones": {
        "25_percent": 3,
        "50_percent": 2,
        "75_percent": 1,
        "100_percent": 2
      },
      "period": {
        "wordsWritten": 15230,
        "daysActive": 12,
        "averagePerDay": 1269
      }
    }
  }
}
```

---

### 2. Get Writing Streaks

**GET** `/analytics/streaks`

**Frontend Example:**
```javascript
const fetchStreaks = async (userId) => {
  const response = await fetch('http://localhost:3000/api/v1/analytics/streaks', {
    headers: {
      'x-clerk-user-id': userId
    }
  });
  
  return await response.json();
};

// Usage for calendar heatmap
const [streaks, setStreaks] = useState([]);
useEffect(() => {
  if (user?.id) {
    fetchStreaks(user.id).then(data => {
      setStreaks(data.data.recentDays);
    });
  }
}, [user]);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 7,
    "recentDays": [
      {
        "date": "2026-01-25",
        "word_count": 1250
      },
      {
        "date": "2026-01-24",
        "word_count": 980
      }
    ]
  }
}
```

---

### 3. Track Analytics Event

**POST** `/analytics/event`

**Request Body:**
```json
{
  "event_type": "content_saved",
  "project_id": "uuid",
  "metadata": {
    "wordCount": 1250
  }
}
```

**Event Types:**
- `content_saved` - Track word count when saving
- `project_created`
- `project_completed`
- `milestone_reached`
- `session_started`
- `session_ended`
- `export_generated`
- `word_written`

**Frontend Example:**
```javascript
const trackEvent = async (userId, eventType, projectId, metadata = {}) => {
  await fetch('http://localhost:3000/api/v1/analytics/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId
    },
    body: JSON.stringify({
      event_type: eventType,
      project_id: projectId,
      metadata
    })
  });
};

// Track when user saves content
const handleSave = async () => {
  await saveProject(user.id, projectId, content, wordCount, version);
  await trackEvent(user.id, 'content_saved', projectId, { wordCount });
};

// Track session start
useEffect(() => {
  trackEvent(user.id, 'session_started', projectId);
  
  return () => {
    trackEvent(user.id, 'session_ended', projectId);
  };
}, []);
```

---

## Suggestions API

### Get Word Suggestions

**POST** `/suggestions`

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "context": "The quick brown fox",
  "limit": 3
}
```

**Frontend Example:**
```javascript
import { debounce } from 'lodash';

const fetchSuggestions = async (userId, context) => {
  const response = await fetch('http://localhost:3000/api/v1/suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId
    },
    body: JSON.stringify({
      context,
      limit: 3
    })
  });
  
  return await response.json();
};

// Debounced suggestion fetching
const debouncedFetchSuggestions = useCallback(
  debounce((context) => {
    if (context.length > 3) {
      fetchSuggestions(user.id, context).then(data => {
        setSuggestions(data.data.suggestions);
      });
    }
  }, 300),
  [user]
);

// On cursor position change or typing
const handleTextChange = (newText, cursorPos) => {
  setText(newText);
  
  // Get last 50 characters before cursor
  const context = newText.slice(Math.max(0, cursorPos - 50), cursorPos);
  debouncedFetchSuggestions(context);
};

// Display suggestions
{suggestions.map((word, index) => (
  <button 
    key={index}
    onClick={() => insertSuggestion(word)}
  >
    <span className="number">{index + 1}</span> {word}
  </button>
))}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": ["jumped", "ran", "walked"]
  }
}
```

---

## WebSocket Events

### Connection Setup

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

// Authenticate
socket.emit('authenticate', {
  userId: user.id
});

socket.on('authenticated', (data) => {
  console.log('WebSocket authenticated');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

### Events to Emit (Frontend → Backend)

#### 1. Sync Content

```javascript
socket.emit('sync:content', {
  projectId: 'uuid',
  content: 'Full project content...',
  wordCount: 15230,
  cursorPosition: 450,
  version: 42
});
```

#### 2. Sync Cursor Position

```javascript
// Send cursor updates for multi-device sync
const handleCursorChange = (position) => {
  socket.emit('sync:cursor', {
    projectId,
    cursorPosition: position
  });
};
```

---

### Events to Listen (Backend → Frontend)

#### 1. Sync Update (Content changed on another device)

```javascript
socket.on('sync:update', (data) => {
  // Don't update if this is the device that made the change
  if (data.socketId !== socket.id) {
    setContent(data.content);
    setWordCount(data.wordCount);
    setVersion(data.version);
    setLastSaved(new Date(data.updatedAt));
  }
});
```

#### 2. Sync Conflict

```javascript
socket.on('sync:conflict', (data) => {
  // Show conflict resolution UI
  setConflictData({
    serverContent: data.serverContent,
    clientContent: content,
    serverVersion: data.serverVersion,
    clientVersion: data.clientVersion
  });
  setShowConflictModal(true);
});

// Handle conflict resolution
const resolveConflict = (chooseServer) => {
  if (chooseServer) {
    setContent(conflictData.serverContent);
    setVersion(conflictData.serverVersion);
  }
  setShowConflictModal(false);
};
```

#### 3. Milestone Reached

```javascript
socket.on('milestone:reached', (data) => {
  // Show celebration animation
  setMilestone({
    type: data.milestone,
    wordCount: data.wordCount
  });
  setShowCelebration(true);
  
  // Auto-hide after 3 seconds
  setTimeout(() => setShowCelebration(false), 3000);
});
```

#### 4. Cursor Update (Multi-device)

```javascript
socket.on('cursor:update', (data) => {
  // Show cursor position from other devices
  if (data.socketId !== socket.id) {
    setOtherDeviceCursor(data.cursorPosition);
  }
});
```

---

## Error Handling

All API errors follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `PROJECT_NOT_FOUND` | 404 | Project doesn't exist |
| `VERSION_CONFLICT` | 409 | Content version mismatch |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SERVER_ERROR` | 500 | Internal server error |

### Frontend Error Handling

```javascript
const handleApiError = (error) => {
  switch (error.error) {
    case 'UNAUTHORIZED':
      // Redirect to login
      navigate('/login');
      break;
      
    case 'VERSION_CONFLICT':
      // Show conflict resolution
      setShowConflictModal(true);
      break;
      
    case 'TOO_MANY_REQUESTS':
      // Show rate limit message
      toast.error('Too many requests. Please wait a moment.');
      break;
      
    default:
      toast.error(error.message);
  }
};

// Usage
try {
  const data = await fetchProject(userId, projectId);
} catch (error) {
  const errorData = await error.json();
  handleApiError(errorData);
}
```

---

## Rate Limiting

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/projects/*` | 100 requests | 1 minute |
| `/api/v1/suggestions` | 30 requests | 1 minute |
| `/api/v1/analytics/*` | 100 requests | 1 minute |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 60
```

### Frontend Handling

```javascript
const checkRateLimit = (response) => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  
  if (remaining < 10) {
    console.warn(`Rate limit warning: ${remaining}/${limit} remaining`);
  }
};
```

---

## Frontend Integration Guide

### Complete React Example

```javascript
// hooks/useProject.js
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import io from 'socket.io-client';
import { debounce } from 'lodash';

const API_BASE = 'http://localhost:3000/api/v1';

export const useProject = (projectId) => {
  const { user } = useUser();
  const [project, setProject] = useState(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [version, setVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io('http://localhost:3000');
    
    newSocket.emit('authenticate', { userId: user.id });
    
    newSocket.on('authenticated', () => {
      console.log('Socket authenticated');
    });

    newSocket.on('sync:update', (data) => {
      if (data.projectId === projectId && data.socketId !== newSocket.id) {
        setContent(data.content);
        setWordCount(data.wordCount);
        setVersion(data.version);
        setLastSaved(new Date(data.updatedAt));
      }
    });

    newSocket.on('milestone:reached', (data) => {
      if (data.projectId === projectId) {
        // Show celebration
        alert(`Milestone reached: ${data.milestone}!`);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user, projectId]);

  // Fetch project
  useEffect(() => {
    if (!user?.id || !projectId) return;

    fetch(`${API_BASE}/projects/${projectId}`, {
      headers: { 'x-clerk-user-id': user.id }
    })
      .then(res => res.json())
      .then(data => {
        setProject(data.data.project);
        setContent(data.data.project.content || '');
        setWordCount(data.data.project.current_word_count || 0);
        setVersion(data.data.project.version || 0);
      });
  }, [user, projectId]);

  // Auto-save function
  const saveProject = useCallback(async (newContent, newWordCount) => {
    if (!user?.id || !projectId) return;

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        },
        body: JSON.stringify({
          content: newContent,
          word_count: newWordCount,
          version
        })
      });

      const data = await response.json();

      if (data.success) {
        setVersion(data.data.project.version);
        setLastSaved(new Date());
        
        // Sync via WebSocket
        socket?.emit('sync:content', {
          projectId,
          content: newContent,
          wordCount: newWordCount,
          version: data.data.project.version
        });
      } else if (data.error === 'VERSION_CONFLICT') {
        // Handle conflict
        const useServer = confirm('Content conflict detected. Use server version?');
        if (useServer) {
          setContent(data.data.serverContent);
          setVersion(data.data.serverVersion);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [user, projectId, version, socket]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((content, wordCount) => {
      saveProject(content, wordCount);
    }, 2000),
    [saveProject]
  );

  // Update content
  const updateContent = (newContent) => {
    setContent(newContent);
    const words = newContent.split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    debouncedSave(newContent, words);
  };

  return {
    project,
    content,
    wordCount,
    version,
    lastSaved,
    saving,
    updateContent,
    saveNow: () => saveProject(content, wordCount)
  };
};

// Usage in component
function EditorPage({ projectId }) {
  const {
    content,
    wordCount,
    lastSaved,
    saving,
    updateContent
  } = useProject(projectId);

  return (
    <div>
      <div className="header">
        <span>Words: {wordCount}</span>
        <span>{saving ? 'Saving...' : `Saved ${formatDate(lastSaved)}`}</span>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => updateContent(e.target.value)}
        placeholder="Start writing..."
      />
    </div>
  );
}
```

---

### Environment Variables

Create `.env` file in your frontend:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

Usage:
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
```

---

## Testing the API

### Using Swagger UI

Navigate to: **http://localhost:3000/api-docs**

### Using cURL

```bash
# Create project
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "x-clerk-user-id: user_123" \
  -d '{"title":"Test Novel","word_goal":50000}'

# Get projects
curl http://localhost:3000/api/v1/projects \
  -H "x-clerk-user-id: user_123"

# Update project
curl -X PUT http://localhost:3000/api/v1/projects/{id} \
  -H "Content-Type: application/json" \
  -H "x-clerk-user-id: user_123" \
  -d '{"content":"Chapter 1...","word_count":1250,"version":1}'
```

---

## Health Check

**GET** `/health`

No authentication required.

```javascript
const checkHealth = async () => {
  const response = await fetch('http://localhost:3000/health');
  const data = await response.json();
  
  console.log(data);
  // {
  //   status: "healthy",
  //   services: {
  //     database: "healthy",
  //     redis: "healthy",
  //     api: "healthy"
  //   }
  // }
};
```

---

## Quick Reference

### Base Headers (All Requests)
```javascript
{
  'Content-Type': 'application/json',
  'x-clerk-user-id': user.id
}
```

### Endpoints Summary
```
GET    /projects              - List all projects
POST   /projects              - Create project
GET    /projects/:id          - Get single project
PUT    /projects/:id          - Update project
DELETE /projects/:id          - Delete project
POST   /projects/:id/export   - Export project

GET    /analytics/stats       - Get user statistics
GET    /analytics/streaks     - Get writing streaks
POST   /analytics/event       - Track analytics event

POST   /suggestions           - Get word suggestions

WS     authenticate           - Authenticate WebSocket
WS     sync:content           - Sync content changes
WS     sync:cursor            - Sync cursor position
```

---

**Need Help?** Check `/api-docs` for interactive API documentation or contact support.
