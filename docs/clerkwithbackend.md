# Writer's Tree - Clerk Backend Authentication Strategy

## 1. Why Clerk is Perfect for Writer's Tree

### 1.1 Advantages Over Custom Auth

✅ **No password management headaches** - Clerk handles it all  
✅ **OAuth out of the box** - Google, GitHub, Apple, etc.  
✅ **Session management** - Automatic refresh, secure cookies  
✅ **User management UI** - Built-in dashboard for admin  
✅ **Email verification** - No SendGrid/Mailgun needed  
✅ **MFA/2FA** - Security without implementation  
✅ **Webhooks** - User lifecycle events  
✅ **Free tier** - 10,000 MAU (Monthly Active Users)  

### 1.2 Clerk Architecture Overview

```
┌─────────────────┐
│   React App     │
│   (Frontend)    │
│                 │
│  - ClerkProvider│
│  - SignIn/Up UI │
│  - useUser()    │
└────────┬────────┘
         │ JWT Token
         │ (in cookies)
         ▼
┌─────────────────┐
│   Backend API   │
│   (Node.js)     │
│                 │
│  - Verify JWT   │
│  - Get user ID  │
│  - Authorize    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
│                 │
│  - User data    │
│  - Projects     │
└─────────────────┘
```

---

## 2. Backend Architecture with Clerk

### 2.1 Recommended Approach: **JWT Verification + User Sync**

**Strategy:**
1. Frontend uses Clerk for authentication (handled by Clerk SDK)
2. Frontend sends Clerk JWT token with every API request
3. Backend verifies JWT token using Clerk's secret key
4. Backend extracts `userId` from verified token
5. Backend syncs user data via Clerk webhooks

**Why this approach:**
- ✅ Stateless backend (no session storage needed)
- ✅ Clerk handles all auth complexity
- ✅ Backend only needs to verify tokens
- ✅ Automatic user sync via webhooks
- ✅ Can work offline (JWT is self-contained)

---

## 3. Implementation Guide

### 3.1 Frontend Setup (React + Clerk)

```bash
npm install @clerk/clerk-react
```

**App.tsx - Clerk Provider Setup**

```typescript
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <WritersTreeApp />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}
```

**API Client - Sending Authenticated Requests**

```typescript
import { useAuth } from '@clerk/clerk-react';

function useAuthenticatedAPI() {
  const { getToken } = useAuth();
  
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Get JWT token from Clerk
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  };
  
  return { apiCall };
}

// Usage in components
function EditorPanel({ projectId }) {
  const { apiCall } = useAuthenticatedAPI();
  const { user } = useUser(); // Get current user from Clerk
  
  const saveContent = async (content: string) => {
    await apiCall(`/projects/${projectId}/content`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  };
  
  return (
    <div>
      <p>Writing as: {user?.fullName}</p>
      {/* Editor UI */}
    </div>
  );
}
```

---

### 3.2 Backend Setup (Node.js + Express)

```bash
npm install @clerk/clerk-sdk-node express cors dotenv
npm install --save-dev @types/express @types/cors
```

**Environment Variables (.env)**

```bash
# Clerk Configuration
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/writerstree

# Server
PORT=3000
NODE_ENV=development
```

---

### 3.3 Backend Authentication Middleware

**middleware/clerkAuth.ts**

```typescript
import { ClerkExpressRequireAuth, RequireAuthProp } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request extends RequireAuthProp {}
  }
}

/**
 * Middleware to verify Clerk JWT and extract user ID
 * 
 * Usage:
 *   app.get('/projects', clerkAuth, async (req, res) => {
 *     const userId = req.auth.userId;
 *     // ... fetch user's projects
 *   });
 */
export const clerkAuth = ClerkExpressRequireAuth({
  // Optional: customize error handling
  onError: (error) => {
    console.error('Clerk auth error:', error);
  },
});

/**
 * Optional: Middleware to verify JWT but don't require it
 * (useful for endpoints that work for both authenticated and anonymous users)
 */
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

export const optionalClerkAuth = ClerkExpressWithAuth({
  onError: (error) => {
    console.error('Optional auth error:', error);
  },
});
```

**Alternative: Manual JWT Verification (More Control)**

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

export async function verifyClerkToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token with Clerk
    const verifiedToken = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    // Extract user ID from verified token
    req.auth = {
      userId: verifiedToken.sub, // Subject = user ID
      sessionId: verifiedToken.sid,
      claims: verifiedToken,
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token verification failed',
      },
    });
  }
}
```

---

### 3.4 Server Setup with Clerk

**server.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { clerkAuth } from './middleware/clerkAuth';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Protected routes (require authentication)
app.use('/api/projects', clerkAuth, projectsRouter);
app.use('/api/users', clerkAuth, usersRouter);

// Webhook endpoint (Clerk sends user events)
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhookHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### 3.5 Database Schema (User Sync)

**Important:** Clerk manages authentication, but you still need to store user-specific data (projects, preferences, etc.)

**Database Schema:**

```sql
-- Users table (synced from Clerk via webhooks)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk user ID (e.g., user_2abc...)
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    profile_image_url TEXT,
    clerk_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- User preferences (Writer's Tree specific)
    preferences JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP
);

-- Projects table (linked to Clerk user ID)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled Project',
    word_goal INTEGER NOT NULL DEFAULT 50000,
    current_word_count INTEGER DEFAULT 0,
    tree_seed VARCHAR(255) NOT NULL,
    tree_species VARCHAR(50) DEFAULT 'oak',
    tree_season VARCHAR(50) DEFAULT 'spring',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    last_edited_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_users_email ON users(email);
```

---

### 3.6 Clerk Webhooks (User Sync)

Clerk sends webhooks when users are created, updated, or deleted. Use these to keep your database in sync.

**webhooks/clerkWebhook.ts**

```typescript
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { Request, Response } from 'express';
import db from '../database';

export async function clerkWebhookHandler(req: Request, res: Response) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET not set');
  }
  
  // Get the headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;
  
  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  
  try {
    evt = wh.verify(req.body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Handle different event types
  const eventType = evt.type;
  
  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      
      case 'session.created':
        await handleSessionCreated(evt.data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleUserCreated(data: any) {
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address;
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const profileImageUrl = data.profile_image_url;
  const clerkCreatedAt = new Date(data.created_at);
  
  console.log('Creating user:', userId, email);
  
  await db.query(
    `INSERT INTO users (id, email, full_name, profile_image_url, clerk_created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [userId, email, fullName, profileImageUrl, clerkCreatedAt]
  );
  
  console.log('User created successfully:', userId);
}

async function handleUserUpdated(data: any) {
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address;
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  const profileImageUrl = data.profile_image_url;
  
  console.log('Updating user:', userId);
  
  await db.query(
    `UPDATE users 
     SET email = $1, full_name = $2, profile_image_url = $3, updated_at = NOW()
     WHERE id = $4`,
    [email, fullName, profileImageUrl, userId]
  );
  
  console.log('User updated successfully:', userId);
}

async function handleUserDeleted(data: any) {
  const userId = data.id;
  
  console.log('Deleting user:', userId);
  
  // Soft delete or hard delete based on your requirements
  await db.query(
    `DELETE FROM users WHERE id = $1`,
    [userId]
  );
  
  console.log('User deleted successfully:', userId);
}

async function handleSessionCreated(data: any) {
  const userId = data.user_id;
  
  // Update last login timestamp
  await db.query(
    `UPDATE users SET last_login = NOW() WHERE id = $1`,
    [userId]
  );
  
  console.log('Session created for user:', userId);
}
```

**Configure Webhook in Clerk Dashboard:**

1. Go to https://dashboard.clerk.com
2. Navigate to **Webhooks**
3. Add endpoint: `https://api.writerstree.com/api/webhooks/clerk`
4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
5. Copy the **Signing Secret** → add to `.env` as `CLERK_WEBHOOK_SECRET`

---

## 4. Protected API Routes Examples

### 4.1 Get User Profile

```typescript
import { clerkAuth } from '../middleware/clerkAuth';
import { Router } from 'express';
import db from '../database';

const router = Router();

// GET /api/users/me
router.get('/me', clerkAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }
    
    const user = result.rows[0];
    
    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profileImageUrl: user.profile_image_url,
        tier: user.subscription_tier,
        preferences: user.preferences,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' },
    });
  }
});

// PATCH /api/users/me
router.patch('/me', clerkAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { preferences } = req.body;
    
    await db.query(
      'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(preferences), userId]
    );
    
    return res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' },
    });
  }
});

export default router;
```

### 4.2 Projects API (with Authorization)

```typescript
import { clerkAuth } from '../middleware/clerkAuth';
import { Router } from 'express';
import db from '../database';
import crypto from 'crypto';

const router = Router();

// GET /api/projects - List user's projects
router.get('/', clerkAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM projects WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY last_edited_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    return res.json({
      success: true,
      data: {
        projects: result.rows,
        total: result.rowCount,
      },
    });
  } catch (error) {
    console.error('List projects error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch projects' },
    });
  }
});

// POST /api/projects - Create new project
router.post('/', clerkAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { title, wordGoal = 50000, treeSpecies = 'oak', treeSeason = 'spring' } = req.body;
    
    // Generate deterministic tree seed
    const treeSeed = crypto
      .createHash('sha256')
      .update(`${userId}-${Date.now()}`)
      .digest('hex');
    
    const result = await db.query(
      `INSERT INTO projects (user_id, title, word_goal, tree_seed, tree_species, tree_season)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, wordGoal, treeSeed, treeSpecies, treeSeason]
    );
    
    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' },
    });
  }
});

// GET /api/projects/:id - Get project (with ownership check)
router.get('/:id', clerkAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const projectId = req.params.id;
    
    const result = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
    }
    
    const project = result.rows[0];
    
    // Authorization check: ensure user owns this project
    if (project.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have access to this project' },
      });
    }
    
    return res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch project' },
    });
  }
});

export default router;
```

---

## 5. Advanced: Getting User Info from Clerk

```typescript
import { clerkClient } from '@clerk/clerk-sdk-node';

// Get full user details from Clerk (if needed)
async function getClerkUser(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId);
    
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      profileImage: user.profileImageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    };
  } catch (error) {
    console.error('Failed to fetch Clerk user:', error);
    return null;
  }
}

// List all users (admin only)
async function listAllUsers() {
  const users = await clerkClient.users.getUserList();
  return users;
}

// Delete user from Clerk (admin only)
async function deleteClerkUser(userId: string) {
  await clerkClient.users.deleteUser(userId);
}
```

---

## 6. Testing Authentication

### 6.1 Manual Testing with cURL

```bash
# 1. Get token from frontend (console.log after login)
# In browser console:
# const token = await window.Clerk.session.getToken();
# console.log(token);

# 2. Test protected endpoint
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"

# 3. Test project creation
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Novel", "wordGoal": 50000}'
```

### 6.2 Automated Testing

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../server';

describe('Protected API Routes', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Get test token (you'll need to create a test user in Clerk dashboard)
    authToken = 'YOUR_TEST_TOKEN';
  });
  
  it('should reject requests without auth token', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .expect(401);
    
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
  
  it('should return user profile with valid token', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });
  
  it('should create project for authenticated user', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test Project', wordGoal: 50000 })
      .expect(201);
    
    expect(response.body.data.title).toBe('Test Project');
  });
});
```

---

## 7. Production Checklist

### ✅ Security
- [ ] Clerk webhook signature verification enabled
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured (only allow your frontend domain)
- [ ] Rate limiting enabled (prevent abuse)
- [ ] Environment variables secured (never commit to git)
- [ ] Database credentials encrypted
- [ ] SQL injection prevention (parameterized queries)

### ✅ Performance
- [ ] Database indexes on `user_id` fields
- [ ] Connection pooling configured
- [ ] Caching for frequently accessed data (Redis)
- [ ] Webhook handlers are async and non-blocking

### ✅ Monitoring
- [ ] Clerk dashboard webhook logs monitored
- [ ] Backend error tracking (Sentry)
- [ ] API response time monitoring
- [ ] Failed webhook retry strategy

### ✅ Data Integrity
- [ ] User sync tested (create, update, delete)
- [ ] Orphaned data cleanup (if user deleted from Clerk)
- [ ] Backup strategy for database
- [ ] Data export capability (GDPR compliance)

---

## 8. Final Recommendation

**Use Clerk's Official Middleware (`ClerkExpressRequireAuth`)** - It's the simplest, most reliable approach:

```typescript
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// All routes under /api require authentication
app.use('/api', ClerkExpressRequireAuth());

// Access user ID in routes
app.get('/api/projects', async (req, res) => {
  const userId = req.auth.userId; // Clerk user ID
  // ... fetch projects
});
```

**Why this is best:**
- ✅ Less code to maintain
- ✅ Automatic token verification
- ✅ Handles edge cases (expired tokens, invalid signatures)
- ✅ Works seamlessly with Clerk frontend SDK
- ✅ TypeScript support out of the box
- ✅ Well-documented and actively maintained

**You're all set!** Clerk handles auth, your backend just verifies tokens and stores user data. Simple, secure, scalable.