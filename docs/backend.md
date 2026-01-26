# Writer's Tree - Backend Architecture & API Specification

## 1. Backend Overview

### 1.1 Purpose
The backend serves as the central data layer for Writer's Tree, handling:
- User authentication and authorization
- Project and content storage
- Real-time synchronization across devices
- Version history management
- Auto-save orchestration
- Word suggestion processing
- Analytics and usage tracking

### 1.2 Architecture Philosophy
- **Stateless API**: RESTful design with JWT authentication
- **Real-time Sync**: WebSocket connections for live updates
- **Scalable**: Horizontal scaling with load balancing
- **Resilient**: Graceful degradation and retry logic
- **Secure**: Encryption at rest and in transit
- **Fast**: <200ms average response time

### 1.3 Technology Stack

**Recommended Stack:**
```
Runtime:        Node.js 20.x LTS
Framework:      Express.js 4.x
Language:       TypeScript 5.x
Database:       PostgreSQL 16.x (primary data)
Cache:          Redis 7.x (sessions, rate limiting)
File Storage:   AWS S3 / Google Cloud Storage (exports, backups)
WebSockets:     Socket.io 4.x (real-time sync)
Authentication: JWT (JSON Web Tokens)
API Docs:       OpenAPI 3.0 / Swagger
Testing:        Jest, Supertest
Monitoring:     Prometheus + Grafana
Logging:        Winston / Pino
Deployment:     Docker + Kubernetes / AWS ECS
```

**Alternative Stacks:**
- Python: FastAPI + SQLAlchemy + PostgreSQL
- Go: Gin + GORM + PostgreSQL
- Ruby: Rails + PostgreSQL

---

## 2. Database Architecture

### 2.1 Schema Design (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE, -- OAuth
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}', -- User settings
    subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'premium'
    subscription_expires_at TIMESTAMP
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled Project',
    word_goal INTEGER NOT NULL DEFAULT 50000,
    current_word_count INTEGER DEFAULT 0,
    tree_seed VARCHAR(255) NOT NULL, -- For deterministic tree generation
    tree_species VARCHAR(50) DEFAULT 'oak', -- oak, willow, pine, maple, cherry
    tree_season VARCHAR(50) DEFAULT 'spring', -- spring, summer, autumn, winter
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'archived'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_edited_at TIMESTAMP DEFAULT NOW()
);

-- Project content (stores the actual writing)
CREATE TABLE project_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id), -- For future collaboration
    is_current BOOLEAN DEFAULT TRUE -- Latest version
);

-- Version history (stores last 10 versions)
CREATE TABLE version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    snapshot_type VARCHAR(50) DEFAULT 'auto', -- 'auto', 'manual', 'milestone'
    metadata JSONB DEFAULT '{}' -- Additional version info
);

-- Milestones (tracks user achievements)
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL, -- '25_percent', '50_percent', '75_percent', '100_percent'
    word_count_at_milestone INTEGER NOT NULL,
    achieved_at TIMESTAMP DEFAULT NOW(),
    celebrated BOOLEAN DEFAULT FALSE -- Whether user saw the bloom animation
);

-- Writing streaks
CREATE TABLE writing_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    word_count INTEGER NOT NULL,
    projects_worked_on INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'project_created', 'milestone_reached', etc.
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_content_project_id ON project_content(project_id);
CREATE INDEX idx_project_content_current ON project_content(is_current);
CREATE INDEX idx_version_history_project_id ON version_history(project_id);
CREATE INDEX idx_milestones_user_project ON milestones(user_id, project_id);
CREATE INDEX idx_writing_streaks_user_date ON writing_streaks(user_id, date);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
```

### 2.2 Database Configuration

```javascript
// PostgreSQL connection pool settings
{
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false }
}
```

### 2.3 Data Retention Policies

- **Project Content**: Indefinite (user-owned data)
- **Version History**: Last 10 versions per project
- **Analytics Events**: 12 months (then archive to cold storage)
- **Session Tokens**: 7 days (configurable)
- **Email Verification Tokens**: 24 hours
- **Password Reset Tokens**: 1 hour

---

## 3. API Architecture

### 3.1 Base URL Structure

```
Production:    https://api.writerstree.com/v1
Staging:       https://api-staging.writerstree.com/v1
Development:   http://localhost:3000/api/v1
```

### 3.2 Authentication Flow

**JWT Token Structure:**
```javascript
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    userId: "uuid",
    email: "user@example.com",
    tier: "free", // or "premium"
    iat: 1234567890, // Issued at
    exp: 1234567890  // Expires at (7 days)
  },
  signature: "..."
}
```

**Token Storage:**
- Access Token: 7 days expiry, stored in httpOnly cookie
- Refresh Token: 30 days expiry (Phase 2 feature)

**Protected Routes:**
All routes except `/auth/*` and `/health` require valid JWT in:
- Cookie: `auth_token` (preferred)
- Header: `Authorization: Bearer <token>`

---

## 4. API Endpoints Specification

### 4.1 Authentication Endpoints

#### `POST /auth/register`
Create a new user account.

**Request Body:**
```json
{
  "email": "writer@example.com",
  "password": "SecurePass123!",
  "fullName": "Jane Writer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created. Please verify your email.",
  "data": {
    "userId": "uuid",
    "email": "writer@example.com",
    "emailVerified": false
  }
}
```

**Validation:**
- Email: Valid format, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Full Name: Optional, max 255 chars

**Errors:**
- `400`: Invalid email or password format
- `409`: Email already exists

---

#### `POST /auth/login`
Authenticate user and issue JWT token.

**Request Body:**
```json
{
  "email": "writer@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "writer@example.com",
      "fullName": "Jane Writer",
      "emailVerified": true,
      "tier": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Set-Cookie Header:**
```
auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

**Errors:**
- `401`: Invalid credentials
- `403`: Email not verified

---

#### `POST /auth/google`
Authenticate via Google OAuth.

**Request Body:**
```json
{
  "googleToken": "google-oauth-token"
}
```

**Response (200 OK):** Same as `/auth/login`

**Flow:**
1. Frontend gets Google OAuth token
2. Backend verifies token with Google
3. Create user if new, or link to existing account
4. Issue JWT token

---

#### `POST /auth/verify-email`
Verify user email with token.

**Request Body:**
```json
{
  "token": "verification-token-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

**Errors:**
- `400`: Invalid or expired token

---

#### `POST /auth/forgot-password`
Request password reset email.

**Request Body:**
```json
{
  "email": "writer@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent."
}
```

**Note:** Always returns success (prevents email enumeration)

---

#### `POST /auth/reset-password`
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-uuid",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully."
}
```

**Errors:**
- `400`: Invalid or expired token
- `400`: Invalid password format

---

#### `POST /auth/logout`
Invalidate session (clear cookie).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

**Set-Cookie Header:**
```
auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

---

### 4.2 User Endpoints

#### `GET /users/me`
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "writer@example.com",
    "fullName": "Jane Writer",
    "emailVerified": true,
    "tier": "free",
    "createdAt": "2026-01-15T10:30:00Z",
    "lastLogin": "2026-01-25T14:20:00Z",
    "preferences": {
      "darkMode": false,
      "fontSize": 18,
      "dyslexicFont": false,
      "showKeyboard": true,
      "wordSuggestions": true
    }
  }
}
```

---

#### `PATCH /users/me`
Update user profile.

**Request Body:**
```json
{
  "fullName": "Jane A. Writer",
  "preferences": {
    "darkMode": true,
    "fontSize": 20
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": { /* updated user object */ }
}
```

---

#### `DELETE /users/me`
Delete user account (GDPR compliance).

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account deleted successfully.",
  "dataExportUrl": "https://s3.../user-data-export.json"
}
```

**Process:**
1. Verify password
2. Generate data export (JSON)
3. Upload to S3 with 7-day expiry
4. Soft delete user (mark as deleted, actual deletion after 30 days)
5. Send confirmation email with export link

---

### 4.3 Project Endpoints

#### `GET /projects`
List all user projects.

**Query Parameters:**
- `status`: Filter by status (active, completed, archived)
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "title": "My First Novel",
        "wordGoal": 50000,
        "currentWordCount": 12847,
        "progress": 25.69,
        "status": "active",
        "treeSeed": "seed-string",
        "treeSpecies": "oak",
        "treeSeason": "spring",
        "createdAt": "2026-01-10T09:00:00Z",
        "lastEditedAt": "2026-01-25T14:30:00Z"
      }
    ],
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### `POST /projects`
Create a new project.

**Request Body:**
```json
{
  "title": "My New Story",
  "wordGoal": 75000,
  "treeSpecies": "willow",
  "treeSeason": "summer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Project created successfully.",
  "data": {
    "id": "uuid",
    "title": "My New Story",
    "wordGoal": 75000,
    "currentWordCount": 0,
    "treeSeed": "generated-seed-uuid",
    "treeSpecies": "willow",
    "treeSeason": "summer",
    "status": "active",
    "createdAt": "2026-01-25T15:00:00Z"
  }
}
```

**Tree Seed Generation:**
```javascript
// Generate deterministic seed from user ID + project ID + timestamp
const treeSeed = crypto.createHash('sha256')
  .update(`${userId}-${projectId}-${Date.now()}`)
  .digest('hex');
```

---

#### `GET /projects/:projectId`
Get project details and content.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "title": "My First Novel",
      "wordGoal": 50000,
      "currentWordCount": 12847,
      "progress": 25.69,
      "treeSeed": "seed-string",
      "treeSpecies": "oak",
      "treeSeason": "spring",
      "status": "active",
      "createdAt": "2026-01-10T09:00:00Z",
      "lastEditedAt": "2026-01-25T14:30:00Z"
    },
    "content": {
      "text": "Chapter 1\n\nIt was a dark and stormy night...",
      "version": 42,
      "wordCount": 12847,
      "lastSavedAt": "2026-01-25T14:30:00Z"
    },
    "milestones": [
      {
        "type": "25_percent",
        "achievedAt": "2026-01-20T18:45:00Z",
        "wordCount": 12500
      }
    ]
  }
}
```

**Errors:**
- `404`: Project not found
- `403`: Unauthorized (not project owner)

---

#### `PATCH /projects/:projectId`
Update project metadata.

**Request Body:**
```json
{
  "title": "My Renamed Novel",
  "wordGoal": 60000,
  "treeSpecies": "maple",
  "treeSeason": "autumn"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project updated successfully.",
  "data": { /* updated project object */ }
}
```

---

#### `DELETE /projects/:projectId`
Archive or delete project.

**Query Parameters:**
- `permanent`: Boolean (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project archived successfully."
}
```

**Logic:**
- If `permanent=false`: Set status to "archived"
- If `permanent=true`: Delete from database (after confirmation)

---

#### `POST /projects/:projectId/restore`
Restore archived project.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project restored successfully."
}
```

---

### 4.4 Content & Auto-Save Endpoints

#### `PUT /projects/:projectId/content`
Save/update project content (auto-save).

**Request Body:**
```json
{
  "content": "Chapter 1\n\nIt was a dark and stormy night...",
  "wordCount": 12847,
  "cursorPosition": 145 // Optional, for sync
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Content saved successfully.",
  "data": {
    "version": 43,
    "wordCount": 12847,
    "savedAt": "2026-01-25T14:35:00Z",
    "milestoneReached": null // or milestone object if new milestone
  }
}
```

**Auto-Save Logic:**
1. Check if content differs from current version
2. Update `project_content.content` and increment version
3. Update `projects.current_word_count` and `last_edited_at`
4. Check for milestone achievement (25%, 50%, 75%, 100%)
5. Create version history snapshot if milestone reached
6. Return milestone data if achieved

**Version History Management:**
- Keep last 10 versions
- Create snapshot every 1000 words or milestone
- Delete oldest version when exceeding 10

---

#### `GET /projects/:projectId/versions`
Get version history.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "uuid",
        "versionNumber": 42,
        "wordCount": 12500,
        "createdAt": "2026-01-24T10:00:00Z",
        "snapshotType": "milestone",
        "metadata": {
          "milestone": "25_percent"
        }
      },
      {
        "id": "uuid",
        "versionNumber": 35,
        "wordCount": 10000,
        "createdAt": "2026-01-22T16:30:00Z",
        "snapshotType": "auto"
      }
    ]
  }
}
```

---

#### `GET /projects/:projectId/versions/:versionId`
Get specific version content.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": {
      "id": "uuid",
      "versionNumber": 42,
      "content": "Chapter 1...",
      "wordCount": 12500,
      "createdAt": "2026-01-24T10:00:00Z"
    }
  }
}
```

---

#### `POST /projects/:projectId/versions/:versionId/restore`
Restore to previous version.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Version restored successfully.",
  "data": {
    "currentVersion": 44,
    "wordCount": 12500
  }
}
```

**Logic:**
1. Get version content
2. Create new version with restored content
3. Update project_content.content and increment version
4. Recalculate word count and milestones

---

### 4.5 Export Endpoints

#### `POST /projects/:projectId/export`
Export project content.

**Request Body:**
```json
{
  "format": "docx", // or "pdf", "txt"
  "includeMetadata": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.../project-export-uuid.docx",
    "expiresAt": "2026-01-26T15:00:00Z",
    "fileSize": 245760 // bytes
  }
}
```

**Process:**
1. Generate file in requested format
2. Upload to S3 with 24-hour expiry
3. Return signed URL for download

**Format Specifications:**
- **TXT**: Plain text, UTF-8 encoding
- **DOCX**: MS Word format with basic formatting (headings, bold, italic)
- **PDF**: A4 size, Times New Roman 12pt, 1-inch margins

---

#### `POST /projects/:projectId/export-tree`
Export tree visualization as image.

**Request Body:**
```json
{
  "format": "png", // or "svg"
  "width": 1920,
  "height": 1080,
  "transparent": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.../tree-export-uuid.png",
    "expiresAt": "2026-01-26T15:00:00Z"
  }
}
```

**Implementation Options:**
1. **Server-side rendering**: Use headless browser (Puppeteer) to render tree
2. **Client-side rendering**: Frontend generates image, uploads to S3 via presigned URL
3. **Hybrid**: Frontend sends tree SVG, backend converts to PNG/PDF

**Recommended: Client-side rendering** (faster, less server load)

---

### 4.6 Analytics & Streaks Endpoints

#### `GET /users/me/stats`
Get writing statistics.

**Query Parameters:**
- `period`: "week", "month", "year", "all" (default: "month")

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalProjects": 5,
    "activeProjects": 2,
    "completedProjects": 1,
    "totalWordsWritten": 87432,
    "currentStreak": 12, // days
    "longestStreak": 45,
    "averageWordsPerDay": 1247,
    "writingDays": 70,
    "milestonesReached": 8,
    "dailyBreakdown": [
      {
        "date": "2026-01-25",
        "wordCount": 1850,
        "projectsWorkedOn": 2
      },
      {
        "date": "2026-01-24",
        "wordCount": 2100,
        "projectsWorkedOn": 1
      }
    ]
  }
}
```

---

#### `POST /analytics/event`
Track analytics event (internal use).

**Request Body:**
```json
{
  "eventType": "milestone_reached",
  "eventData": {
    "projectId": "uuid",
    "milestone": "50_percent",
    "wordCount": 25000
  },
  "sessionId": "session-uuid"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Event tracked."
}
```

**Common Event Types:**
- `project_created`
- `project_completed`
- `milestone_reached`
- `bloom_animation_viewed`
- `tree_exported`
- `content_exported`
- `settings_changed`

---

### 4.7 Word Suggestions Endpoint (Phase 1.5)

#### `POST /suggestions`
Get word suggestions based on context.

**Request Body:**
```json
{
  "context": "The quick brown fox jumped over the lazy",
  "limit": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "word": "dog", "confidence": 0.95 },
      { "word": "cat", "confidence": 0.82 },
      { "word": "fence", "confidence": 0.71 }
    ]
  }
}
```

**Implementation Options:**
1. **Local Model**: Use lightweight NLP model (GPT-2 small, BERT)
2. **External API**: OpenAI API, Cohere, or similar
3. **Hybrid**: Cache common suggestions, fallback to API

**Performance Requirements:**
- Response time: <100ms
- Rate limit: 60 requests/minute per user
- Cache common contexts (Redis)

**Recommended: OpenAI API** (GPT-3.5-turbo with completion mode)
- Cost-effective ($0.002 per 1K tokens)
- High-quality suggestions
- Easy integration

---

## 5. Real-Time Synchronization (WebSockets)

### 5.1 WebSocket Architecture

**Technology**: Socket.io (fallback to long-polling)

**Connection Flow:**
```javascript
// Client connects with JWT
socket.on('connect', () => {
  socket.emit('authenticate', { token: jwt });
});

// Server authenticates
socket.on('authenticate', (data) => {
  const user = verifyJWT(data.token);
  socket.userId = user.id;
  socket.join(`user:${user.id}`);
});
```

### 5.2 Real-Time Events

#### Client → Server Events

**`sync:content`** - Sync content changes
```javascript
{
  projectId: 'uuid',
  content: 'Updated text...',
  wordCount: 12850,
  cursorPosition: 150,
  version: 43
}
```

**`sync:cursor`** - Sync cursor position (for future collaboration)
```javascript
{
  projectId: 'uuid',
  cursorPosition: 150
}
```

#### Server → Client Events

**`sync:update`** - Content updated (from another device)
```javascript
{
  projectId: 'uuid',
  content: 'Updated text from another device...',
  wordCount: 12900,
  version: 44,
  updatedAt: '2026-01-25T15:00:00Z'
}
```

**`sync:conflict`** - Conflict detected (simultaneous edits)
```javascript
{
  projectId: 'uuid',
  serverVersion: 45,
  clientVersion: 44,
  serverContent: '...',
  message: 'Your changes conflict with recent updates'
}
```

**`milestone:reached`** - Milestone achieved
```javascript
{
  projectId: 'uuid',
  milestone: '50_percent',
  wordCount: 25000
}
```

### 5.3 Conflict Resolution Strategy

**Last-Write-Wins** (Simple, Phase 1):
- Server timestamp determines winner
- Client receives server version
- Optional: Show notification and allow manual merge

**Operational Transformation** (Complex, Phase 2+):
- Track character-level changes
- Apply transformations to resolve conflicts
- Requires more complex logic

---

## 6. Security & Authentication

### 6.1 Security Measures

**Password Security:**
```javascript
// Hashing with bcrypt (salt rounds: 12)
const passwordHash = await bcrypt.hash(password, 12);

// Password validation
const isValid = await bcrypt.compare(password, passwordHash);
```

**JWT Secret Management:**
- Stored in environment variables
- Rotated quarterly
- Separate secrets for dev/staging/production

**Rate Limiting:**
```javascript
// Express rate limiter
const rateLimit = require('express-rate-limit');

// Auth endpoints: 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again later.'
});

// API endpoints: 100 requests per 15 minutes per user
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user.id
});
```

**CORS Configuration:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://writerstree.com',
    'https://www.writerstree.com',
    'http://localhost:3000' // Dev only
  ],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**SQL Injection Prevention:**
- Use parameterized queries (prepared statements)
- Never concatenate user input into SQL
- Use ORM (Sequelize, Prisma) with built-in escaping

**XSS Prevention:**
- Sanitize user input on save
- Use Content Security Policy (CSP) headers
- Escape output on render

### 6.2 Data Encryption

**At Rest:**
- Database encryption using PostgreSQL pgcrypto extension
- AES-256 encryption for sensitive fields
- Encrypted backups to S3 with SSE-S3 or SSE-KMS

**In Transit:**
- TLS 1.3 for all API communications
- HTTPS only (redirect HTTP to HTTPS)
- Secure WebSocket connections (wss://)

**Content Encryption (Optional Premium Feature):**
```javascript
// Encrypt project content before storing
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encryptContent(content, userKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, userKey, iv);
  const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}
```

---

## 7. Error Handling & Logging

### 7.1 Error Response Format

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "timestamp": "2026-01-25T15:30:00Z",
    "requestId": "req-uuid-123"
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful deletion
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Resource conflict (e.g., email exists)
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Temporary outage

### 7.2 Error Codes

```javascript
const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email',
  TOKEN_EXPIRED: 'Session expired, please login again',
  INVALID_TOKEN: 'Invalid authentication token',
  
  // Validation errors
  VALIDATION_ERROR: 'Validation failed',
  INVALID_EMAIL: 'Invalid email format',
  WEAK_PASSWORD: 'Password must be at least 8 characters',
  
  // Resource errors
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  FORBIDDEN: 'You do not have permission',
  
  // Business logic errors
  WORD_GOAL_TOO_LOW: 'Word goal must be at least 1,000',
  MAX_PROJECTS_REACHED: 'Free tier limited to 5 projects',
  
  // Server errors
  INTERNAL_ERROR: 'Something went wrong',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_SERVICE_ERROR: 'External service unavailable'
};
```

### 7.3 Logging Strategy

**Log Levels:**
- `ERROR`: Server errors, exceptions, failed operations
- `WARN`: Deprecated API usage, rate limit warnings
- `INFO`: Request/response logs, authentication events
- `DEBUG`: Detailed debugging info (dev/staging only)

**Structured Logging with Winston:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'writers-tree-api',
    environment: process.env.NODE_ENV 
  },
  transports: [
    // Error logs to separate file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // All logs to combined file
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    // Console output in development
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    });
  });
  
  next();
}
```

**What to Log:**
- All authentication attempts (success/failure)
- API requests with response times
- Database query performance (>100ms)
- Auto-save operations
- Milestone achievements
- Export operations
- Errors with full stack traces
- Rate limit violations
- Security events (failed auth, suspicious activity)

**What NOT to Log:**
- Passwords (plain or hashed)
- Full JWT tokens
- User content (privacy)
- Credit card information
- Personal identifiable information (PII)

---

## 8. Performance Optimization

### 8.1 Database Optimization

**Query Optimization:**
```sql
-- Use EXPLAIN ANALYZE to optimize slow queries
EXPLAIN ANALYZE
SELECT p.*, pc.content, pc.word_count
FROM projects p
JOIN project_content pc ON p.id = pc.project_id
WHERE p.user_id = $1 AND pc.is_current = true
ORDER BY p.last_edited_at DESC
LIMIT 10;

-- Add composite indexes for common queries
CREATE INDEX idx_projects_user_status_edited 
ON projects(user_id, status, last_edited_at DESC);

-- Partial index for active projects only
CREATE INDEX idx_projects_active 
ON projects(user_id, last_edited_at) 
WHERE status = 'active';
```

**Connection Pooling:**
```javascript
// PostgreSQL connection pool
const { Pool } = require('pg');

const pool = new Pool({
  max: 20,                    // Max connections
  min: 5,                     // Min connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000,
  maxUses: 7500,              // Recycle connections
});

// Monitor pool health
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Database pool error', { error: err });
});
```

**Query Result Caching:**
```javascript
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Cache user preferences (rarely change)
async function getUserPreferences(userId) {
  const cacheKey = `user:${userId}:preferences`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const preferences = await db.query(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(preferences));
  
  return preferences;
}

// Invalidate cache on update
async function updateUserPreferences(userId, newPreferences) {
  await db.query(
    'UPDATE users SET preferences = $1 WHERE id = $2',
    [newPreferences, userId]
  );
  
  // Invalidate cache
  await redis.del(`user:${userId}:preferences`);
}
```

### 8.2 API Response Optimization

**Pagination:**
```javascript
// Efficient cursor-based pagination for large datasets
async function getProjects(userId, cursor, limit = 20) {
  const query = `
    SELECT * FROM projects
    WHERE user_id = $1 
    AND ($2::timestamp IS NULL OR last_edited_at < $2)
    ORDER BY last_edited_at DESC
    LIMIT $3
  `;
  
  const projects = await db.query(query, [userId, cursor, limit + 1]);
  
  const hasMore = projects.length > limit;
  const results = hasMore ? projects.slice(0, -1) : projects;
  const nextCursor = hasMore ? results[results.length - 1].last_edited_at : null;
  
  return {
    projects: results,
    pagination: {
      hasMore,
      nextCursor,
      limit
    }
  };
}
```

**Response Compression:**
```javascript
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression
  threshold: 1024 // Only compress responses > 1KB
}));
```

**Partial Responses:**
```javascript
// Allow clients to request specific fields
// GET /projects/:id?fields=title,wordGoal,currentWordCount

async function getProject(projectId, userId, fields) {
  const allowedFields = ['id', 'title', 'wordGoal', 'currentWordCount', 
                          'treeSeed', 'treeSpecies', 'createdAt'];
  
  const selectedFields = fields 
    ? fields.split(',').filter(f => allowedFields.includes(f))
    : allowedFields;
  
  const query = `SELECT ${selectedFields.join(', ')} 
                 FROM projects 
                 WHERE id = $1 AND user_id = $2`;
  
  return await db.query(query, [projectId, userId]);
}
```

### 8.3 Auto-Save Optimization

**Debouncing Strategy:**
```javascript
// Client-side debouncing (send after 10s of inactivity)
let autoSaveTimeout;
let pendingContent = null;

function onContentChange(content, wordCount) {
  pendingContent = { content, wordCount };
  
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    saveContent(pendingContent);
    pendingContent = null;
  }, 10000); // 10 seconds
}

// Server-side: Batch multiple saves
const saveQueue = new Map();

function queueSave(projectId, content, wordCount) {
  saveQueue.set(projectId, { content, wordCount, timestamp: Date.now() });
}

// Process queue every 5 seconds
setInterval(async () => {
  if (saveQueue.size === 0) return;
  
  const saves = Array.from(saveQueue.entries());
  saveQueue.clear();
  
  await Promise.all(saves.map(([projectId, data]) => 
    db.query(
      'UPDATE project_content SET content = $1, word_count = $2 WHERE project_id = $3',
      [data.content, data.wordCount, projectId]
    )
  ));
}, 5000);
```

**Delta Sync (Phase 2):**
```javascript
// Instead of sending full content, send only changes
const diff = require('diff');

function createPatch(oldContent, newContent) {
  const patches = diff.createPatch('content', oldContent, newContent);
  return patches;
}

function applyPatch(oldContent, patch) {
  const newContent = diff.applyPatch(oldContent, patch);
  return newContent;
}

// Save bandwidth by sending deltas
const delta = createPatch(lastSavedContent, currentContent);
socket.emit('sync:content', { projectId, delta });
```

---

## 9. Monitoring & Observability

### 9.1 Health Check Endpoint

```javascript
// GET /health
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      disk: 'unknown',
      memory: 'unknown'
    }
  };
  
  // Check database
  try {
    await db.query('SELECT 1');
    health.checks.database = 'healthy';
  } catch (err) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (err) {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }
  
  // Check disk space
  const diskUsage = await checkDiskSpace('/');
  health.checks.disk = diskUsage.free > 1000000000 ? 'healthy' : 'warning';
  
  // Check memory
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 9.2 Metrics Collection (Prometheus)

```javascript
const promClient = require('prom-client');

// Enable default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const autoSaveCounter = new promClient.Counter({
  name: 'auto_saves_total',
  help: 'Total number of auto-saves',
  labelNames: ['status']
});

const activeWebsockets = new promClient.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections'
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Middleware to track request duration
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
}
```

### 9.3 Alerting Configuration

**Alert Rules (Prometheus AlertManager):**
```yaml
# load-test.yml
config:
  target: 'https://api.writerstree.com'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Ramp up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  payload:
    path: "users.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "User journey - Create and write"
    flow:
      # Register
      - post:
          url: "/v1/auth/register"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
            fullName: "Load Test User"
          capture:
            - json: "$.data.token"
              as: "authToken"
      
      # Create project
      - post:
          url: "/v1/projects"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            title: "Load Test Project"
            wordGoal: 50000
          capture:
            - json: "$.data.id"
              as: "projectId"
      
      # Auto-save (simulate typing)
      - loop:
        - put:
            url: "/v1/projects/{{ projectId }}/content"
            headers:
              Authorization: "Bearer {{ authToken }}"
            json:
              content: "{{ $randomString() }}"
              wordCount: "{{ $randomNumber(100, 500) }}"
          think: 10
        count: 5
      
      # Get project
      - get:
          url: "/v1/projects/{{ projectId }}"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Read-heavy workload"
    weight: 70
    flow:
      # Login existing user
      - post:
          url: "/v1/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.data.token"
              as: "authToken"
      
      # List projects
      - get:
          url: "/v1/projects"
          headers:
            Authorization: "Bearer {{ authToken }}"
          capture:
            - json: "$.data.projects[0].id"
              as: "projectId"
      
      # Get project content
      - get:
          url: "/v1/projects/{{ projectId }}"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      # Get stats
      - get:
          url: "/v1/users/me/stats"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

**Run load test:**
```bash
artillery run load-test.yml --output report.json
artillery report report.json
```

---

## 12. Backup & Disaster Recovery

### 12.1 Database Backup Strategy

**Automated Backups:**
```bash
#!/bin/bash
# backup.sh - Daily PostgreSQL backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://writerstree-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --file=$BACKUP_DIR/writerstree_$DATE.dump

# Compress
gzip $BACKUP_DIR/writerstree_$DATE.dump

# Upload to S3
aws s3 cp $BACKUP_DIR/writerstree_$DATE.dump.gz \
  $S3_BUCKET/daily/writerstree_$DATE.dump.gz

# Encrypt sensitive backup (optional)
gpg --encrypt --recipient backup@writerstree.com \
  $BACKUP_DIR/writerstree_$DATE.dump.gz

# Keep only last 7 days locally
find $BACKUP_DIR -type f -mtime +7 -delete

# S3 lifecycle policy keeps:
# - Daily backups: 30 days
# - Weekly backups: 90 days
# - Monthly backups: 1 year
```

**Cron schedule:**
```cron
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup.sh

# Weekly full backup (Sundays at 3 AM)
0 3 * * 0 /opt/scripts/backup-full.sh

# Monthly backup (1st of month at 4 AM)
0 4 1 * * /opt/scripts/backup-monthly.sh
```

### 12.2 Restore Procedures

```bash
#!/bin/bash
# restore.sh - Restore from backup

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  exit 1
fi

# Download from S3 if not local
if [[ $BACKUP_FILE == s3://* ]]; then
  aws s3 cp $BACKUP_FILE ./temp_backup.dump.gz
  BACKUP_FILE="./temp_backup.dump.gz"
fi

# Decompress
gunzip -c $BACKUP_FILE > temp_backup.dump

# Stop API server
docker-compose stop api

# Drop and recreate database
psql -h $DB_HOST -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -U postgres -c "CREATE DATABASE $DB_NAME;"

# Restore
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --no-owner --no-acl temp_backup.dump

# Cleanup
rm temp_backup.dump

# Start API server
docker-compose start api

echo "Restore complete!"
```

### 12.3 Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 hours  
**RPO (Recovery Point Objective)**: 24 hours

**Disaster Scenarios:**

**1. Database Failure:**
- Switch to read replica (if available)
- Restore from latest backup
- Verify data integrity
- Resume operations

**2. Server Failure:**
- Redirect traffic to backup server
- Spin up new instance from Docker image
- Restore database from backup
- Update DNS/load balancer

**3. Data Corruption:**
- Identify corruption point from logs
- Restore from backup before corruption
- Replay transaction logs (if available)
- Notify affected users

**4. Security Breach:**
- Isolate compromised systems immediately
- Rotate all secrets (JWT, API keys, DB passwords)
- Force logout all users
- Audit access logs
- Restore from clean backup
- Notify users and authorities

---

## 13. API Documentation

### 13.1 OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Writer's Tree API
  version: 1.0.0
  description: Backend API for Writer's Tree - a writing platform with visual tree growth
  contact:
    name: API Support
    email: api@writerstree.com
    url: https://docs.writerstree.com

servers:
  - url: https://api.writerstree.com/v1
    description: Production server
  - url: https://api-staging.writerstree.com/v1
    description: Staging server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        fullName:
          type: string
        emailVerified:
          type: boolean
        tier:
          type: string
          enum: [free, premium]
        createdAt:
          type: string
          format: date-time

    Project:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
          maxLength: 500
        wordGoal:
          type: integer
          minimum: 1000
        currentWordCount:
          type: integer
        progress:
          type: number
          format: float
        treeSeed:
          type: string
        treeSpecies:
          type: string
          enum: [oak, willow, pine, maple, cherry]
        treeSeason:
          type: string
          enum: [spring, summer, autumn, winter]
        status:
          type: string
          enum: [active, completed, archived]
        createdAt:
          type: string
          format: date-time
        lastEditedAt:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object

paths:
  /auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                fullName:
                  type: string
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      userId:
                        type: string
                      email:
                        type: string
        '400':
          description: Validation error
        '409':
          description: Email already exists

  /auth/login:
    post:
      summary: Login user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      user:
                        $ref: '#/components/schemas/User'
                      token:
                        type: string
        '401':
          description: Invalid credentials

  /projects:
    get:
      summary: List user projects
      tags: [Projects]
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, completed, archived]
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
            default: 50
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Projects retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      projects:
                        type: array
                        items:
                          $ref: '#/components/schemas/Project'
                      total:
                        type: integer
                      limit:
                        type: integer
                      offset:
                        type: integer

    post:
      summary: Create new project
      tags: [Projects]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title]
              properties:
                title:
                  type: string
                wordGoal:
                  type: integer
                  default: 50000
                treeSpecies:
                  type: string
                  default: oak
                treeSeason:
                  type: string
                  default: spring
      responses:
        '201':
          description: Project created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/Project'
```

### 13.2 Swagger UI Setup

```javascript
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/openapi.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Writer's Tree API Docs"
}));
```

Access at: `https://api.writerstree.com/api-docs`

---

## 14. Scalability Considerations

### 14.1 Horizontal Scaling

**Load Balancer Configuration (NGINX):**
```nginx
upstream writerstree_api {
    least_conn;  # Route to server with fewest connections
    
    server api-1.writerstree.com:3000 weight=1 max_fails=3 fail_timeout=30s;
    server api-2.writerstree.com:3000 weight=1 max_fails=3 fail_timeout=30s;
    server api-3.writerstree.com:3000 weight=1 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.writerstree.com;
    
    ssl_certificate /etc/ssl/certs/writerstree.crt;
    ssl_certificate_key /etc/ssl/private/writerstree.key;
    
    location / {
        proxy_pass http://writerstree_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://writerstree_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 14.2 Database Read Replicas

```javascript
// Database connection with read replicas
const { Pool } = require('pg');

const masterPool = new Pool({
  host: process.env.DB_MASTER_HOST,
  // ... master config
});

const replicaPools = [
  new Pool({ host: process.env.DB_REPLICA_1_HOST }),
  new Pool({ host: process.env.DB_REPLICA_2_HOST })
];

let currentReplica = 0;

function getReadConnection() {
  const pool = replicaPools[currentReplica];
  currentReplica = (currentReplica + 1) % replicaPools.length;
  return pool;
}

function getWriteConnection() {
  return masterPool;
}

// Usage
async function getProject(projectId) {
  const db = getReadConnection();
  return await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
}

async function updateProject(projectId, data) {
  const db = getWriteConnection();
  return await db.query('UPDATE projects SET ... WHERE id = $1', [projectId]);
}
```

### 14.3 Caching Strategy

**Multi-Layer Caching:**

```javascript
// 1. Application-level cache (in-memory)
const NodeCache = require('node-cache');
const appCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// 2. Redis cache (distributed)
const redis = require('./redis');

async function getCachedData(key, fetchFunction, ttl = 3600) {
  // Try app cache first (fastest)
  let data = appCache.get(key);
  if (data) {
    return data;
  }
  
  // Try Redis cache (fast)
  data = await redis.get(key);
  if (data) {
    const parsed = JSON.parse(data);
    appCache.set(key, parsed);
    return parsed;
  }
  
  // Fetch from database (slow)
  data = await fetchFunction();
  
  // Store in both caches
  appCache.set(key, data);
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

// Example usage
async function getUserProjects(userId) {
  return await getCachedData(
    `user:${userId}:projects`,
    async () => {
      return await db.query(
        'SELECT * FROM projects WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );
    },
    1800 // 30 minutes
  );
}

// Cache invalidation on update
async function updateProject(projectId, userId, data) {
  await db.query('UPDATE projects SET ... WHERE id = $1', [projectId]);
  
  // Invalidate caches
  appCache.del(`user:${userId}:projects`);
  appCache.del(`project:${projectId}`);
  await redis.del(`user:${userId}:projects`);
  await redis.del(`project:${projectId}`);
}
```

---

## 15. Final Checklist

### Pre-Production Checklist

**Security:**
- [ ] All passwords hashed with bcrypt (12+ rounds)
- [ ] JWT secrets are strong and environment-specific
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention implemented
- [ ] CSRF protection enabled (if using cookies)
- [ ] Security headers configured (helmet.js)
- [ ] Dependency vulnerabilities scanned (npm audit)

**Performance:**
- [ ] Database indexes on all foreign keys
- [ ] Query performance tested (all queries <100ms)
- [ ] Connection pooling configured
- [ ] Redis caching implemented
- [ ] Compression enabled
- [ ] CDN configured for static assets
- [ ] Load testing completed (100+ concurrent users)
- [ ] Memory leaks tested and fixed

**Monitoring:**
- [ ] Health check endpoint working
- [ ] Prometheus metrics exposed
- [ ] Grafana dashboards created
- [ ] Error tracking configured (Sentry)
- [ ] Logging properly structured
- [ ] Alerts configured for critical issues
- [ ] Uptime monitoring set up

**Deployment:**
- [ ] Docker images built and tested
- [ ] CI/CD pipeline configured
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Zero-downtime deployment verified

**Documentation:**
- [ ] API documentation complete (OpenAPI/Swagger)
- [ ] README with setup instructions
- [ ] Architecture diagrams created
- [ ] Runbook for common issues
- [ ] Database schema documented

**Compliance:**
- [ ] GDPR compliance verified (data export, deletion)
- [ ] Privacy policy reviewed
- [ ] Terms of service finalized
- [ ] Cookie consent implemented
- [ ] Data retention policies documented

---

## 16. Support & Maintenance

### 16.1 Common Issues & Solutions

**Issue: High Database CPU**
- Check slow query log
- Add missing indexes
- Optimize N+1 queries
- Increase connection pool size
- Consider read replicas

**Issue: Memory Leaks**
- Monitor heap usage over time
- Use heap snapshots to identify leaks
- Check for unclosed database connections
- Review event listeners (remove when done)
- Use weak references where appropriate

**Issue: WebSocket Connection Drops**
- Implement reconnection logic on client
- Add heartbeat/ping-pong messages
- Check load balancer timeout settings
- Verify sticky sessions enabled

**Issue: Auto-Save Conflicts**
- Implement optimistic locking (version numbers)
- Show conflict resolution UI to user
- Consider operational transformation
- Add last-write-wins timestamp

### 16.2 Maintenance Windows

**Weekly Maintenance (Sundays 2-4 AM UTC):**
- Database maintenance (VACUUM, ANALYZE)
- Log rotation and archival
- Security updates
- Dependency updates

**Monthly Maintenance (First Sunday 2-6 AM UTC):**
- Full database backup and verification
- Performance audit and optimization
- Security audit
- Capacity planning review

---

**Document Version**: 1.0  
**Last Updated**: January 25, 2026  
**Owner**: Backend Team  
**Review Cycle**: Quarterly
groups:
  - name: writers_tree_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      # Database connection issues
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
      
      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time > 2s"
      
      # Disk space low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Less than 10% disk space remaining"
```

---

## 10. Deployment & DevOps

### 10.1 Dockerfile

```dockerfile
# Multi-stage build for smaller image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

### 10.2 Docker Compose (Development)

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://postgres:password@postgres:5432/writerstree
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
    command: npm run dev

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: writerstree
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

### 10.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy Writers Tree API

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: writerstree_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/writerstree_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/writerstree_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            writerstree/api:latest
            writerstree/api:${{ github.sha }}
          cache-from: type=registry,ref=writerstree/api:latest
          cache-to: type=inline

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/writerstree
            docker-compose pull api
            docker-compose up -d api
            docker-compose exec -T api npm run migrate
```

### 10.4 Environment Variables

```bash
# .env.example
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://user:password@host:5432/dbname
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=secure-password

# JWT
JWT_SECRET=super-secret-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Email (SendGrid, Mailgun, etc.)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-api-key
EMAIL_FROM=noreply@writerstree.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.writerstree.com/v1/auth/google/callback

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=writerstree-exports
AWS_REGION=us-east-1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_ENABLED=true

# Word Suggestions (OpenAI)
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-3.5-turbo

# Feature Flags
FEATURE_WORD_SUGGESTIONS=true
FEATURE_REAL_TIME_SYNC=true
FEATURE_BLOOM_ANIMATIONS=true
```

---

## 11. Testing Strategy

### 11.1 Unit Tests (Jest)

```javascript
// tests/services/auth.test.js
const { register, login, verifyEmail } = require('../../src/services/auth');
const db = require('../../src/database');
const bcrypt = require('bcrypt');

jest.mock('../../src/database');
jest.mock('bcrypt');

describe('Auth Service', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User'
      };
      
      bcrypt.hash.mockResolvedValue('hashed-password');
      db.query.mockResolvedValue({ rows: [{ id: 'user-123', ...userData }] });
      
      const result = await register(userData);
      
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 12);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBeUndefined(); // Password not returned
    });
    
    it('should throw error if email already exists', async () => {
      db.query.mockRejectedValue({ code: '23505' }); // Unique violation
      
      await expect(register({
        email: 'existing@example.com',
        password: 'password'
      })).rejects.toThrow('Email already exists');
    });
  });
  
  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        email_verified: true
      };
      
      db.query.mockResolvedValue({ rows: [user] });
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await login('test@example.com', 'password');
      
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });
    
    it('should throw error for unverified email', async () => {
      db.query.mockResolvedValue({ 
        rows: [{ email_verified: false }] 
      });
      
      await expect(login('test@example.com', 'password'))
        .rejects.toThrow('Email not verified');
    });
  });
});
```

### 11.2 Integration Tests

```javascript
// tests/integration/projects.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database');

describe('Projects API', () => {
  let authToken;
  let userId;
  
  beforeAll(async () => {
    // Create test user and get auth token
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User'
      });
    
    authToken = res.body.data.token;
    userId = res.body.data.user.id;
  });
  
  afterAll(async () => {
    // Cleanup test data
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    await db.end();
  });
  
  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'My Test Novel',
          wordGoal: 50000,
          treeSpecies: 'oak'
        })
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My Test Novel');
      expect(res.body.data.wordGoal).toBe(50000);
      expect(res.body.data.treeSeed).toBeDefined();
    });
    
    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/v1/projects')
        .send({ title: 'Test' })
        .expect(401);
    });
    
    it('should validate word goal minimum', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Project',
          wordGoal: 500 // Below minimum
        })
        .expect(400);
      
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('GET /projects/:id', () => {
    let projectId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Project' });
      
      projectId = res.body.data.id;
    });
    
    it('should return project with content', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.data.project.id).toBe(projectId);
      expect(res.body.data.content).toBeDefined();
    });
    
    it('should not allow access to other users projects', async () => {
      // Create second user
      const res2 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'other@example.com',
          password: 'SecurePass123!'
        });
      
      const otherToken = res2.body.data.token;
      
      await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });
});
```

### 11.3 Load Testing (Artillery)

```yaml