# Writer's Tree - Backend Server

## Setup Instructions

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 16.x or higher
- (Optional) Redis 7.x for caching

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Update database credentials in `.env`:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: writerstree)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

3. **Create PostgreSQL database:**
```bash
psql -U postgres
CREATE DATABASE writerstree;
\q
```

4. **Run database migrations:**
```bash
npm run db:migrate
```

To reset and recreate tables:
```bash
npm run db:migrate -- --reset
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### API Endpoints

Base URL: `http://localhost:3000/api/v1`

#### Users (Clerk Integration)
- `POST /users/sync` - Sync Clerk user with backend (public endpoint)
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user preferences
- `DELETE /users/me` - Delete user account

#### Projects
- `POST /projects` - Create new project
- `GET /projects` - List all user projects
- `GET /projects/:id` - Get project by ID
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete/archive project
- `POST /projects/:id/restore` - Restore archived project
- `PUT /projects/:id/content` - Save project content (auto-save)
- `GET /projects/:id/versions` - Get version history
- `GET /projects/:id/versions/:versionId` - Get specific version
- `POST /projects/:id/versions/:versionId/restore` - Restore version
- `POST /projects/:id/export` - Export project (TXT/DOCX/PDF)
- `POST /projects/:id/export-tree` - Export tree visualization (PNG/SVG)

#### Word Suggestions
- `POST /suggestions` - Get word suggestions based on context

#### Analytics & Streaks
- `GET /analytics/stats` - Get writing statistics
- `GET /analytics/streaks` - Get writing streaks
- `POST /analytics/event` - Track analytics event

#### Health Check
- `GET /health` - Server health status

### Testing the API

**Sync Clerk user (after sign-in):**
```bash
curl -X POST http://localhost:3000/api/v1/users/sync \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId":"user_xxx","email":"writer@example.com","fullName":"Jane Writer"}'
```

**Create a project (with Clerk user ID in header):**
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "x-clerk-user-id: user_xxx" \
  -d '{"title":"My Novel","wordGoal":50000}'
```

**Get word suggestions:**
```bash
curl -X POST http://localhost:3000/api/v1/suggestions \
  -H "Content-Type: application/json" \
  -H "x-clerk-user-id: user_xxx" \
  -d '{"context":"The quick brown fox jumped over the lazy","limit":3}'
```

### WebSocket Real-Time Sync

Connect to WebSocket server:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', { userId: 'clerk_user_xxx' });

// Listen for authentication success
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});

// Sync content
socket.emit('sync:content', {
  projectId: 'project-uuid',
  content: 'Updated text...',
  wordCount: 12850,
  version: 43
});

// Listen for updates from other devices
socket.on('sync:update', (data) => {
  console.log('Content updated:', data);
});

// Listen for conflicts
socket.on('sync:conflict', (data) => {
  console.log('Conflict detected:', data);
});

// Listen for milestones
socket.on('milestone:reached', (data) => {
  console.log('Milestone reached:', data);
});
```

### Database Schema

See `src/models/schema.js` for complete database structure.

Main tables:
- `users` - User accounts (Clerk integration)
- `projects` - Writing projects
- `project_content` - Project content and versions
- `version_history` - Content snapshots (last 10 saves)
- `milestones` - Achievement tracking (25%, 50%, 75%, 100%)
- `writing_streaks` - Daily writing activity
- `analytics_events` - User activity tracking

### WebSocket Features

- **Real-time content sync** across multiple devices
- **Conflict detection** with last-write-wins resolution
- **Milestone notifications** when reaching word count goals
- **Cursor position sync** for future collaborative editing

### Architecture

```
src/
├── config/          # Configuration files (database, logger)
├── controllers/     # Request handlers (user, project, analytics, export, suggestions)
├── middleware/      # Express middleware (auth, validation, error handling)
├── models/          # Database models (User, Project)
├── routes/          # API routes (users, projects, analytics, suggestions)
├── scripts/         # Utility scripts (migration)
├── websocket.js     # WebSocket server (Socket.io)
└── index.js         # Server entry point
```

### Security Features

- Clerk authentication integration
- Rate limiting on auth and API endpoints
- CORS protection with specific origins
- Helmet security headers
- Input validation with Joi
- SQL injection prevention with parameterized queries
- Version conflict detection

### Troubleshooting

**Database connection error:**
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

**Port already in use:**
- Change `PORT` in `.env` to another port (e.g., 3001)

**Module not found errors:**
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
