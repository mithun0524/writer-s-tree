# Writer's Tree - Complete Railway Deployment Guide

## 1. Why Railway?

✅ **Simple deployment** - Git push to deploy  
✅ **Free PostgreSQL** - 512MB RAM, 1GB storage (free tier)  
✅ **Environment variables** - Easy to manage  
✅ **Automatic HTTPS** - Free SSL certificates  
✅ **Build logs** - Easy debugging  
✅ **Vertical scaling** - Upgrade as you grow  
✅ **$5/month free credit** - Enough for early development  

---

## 2. Prerequisites Checklist

Before you start, make sure you have:

- [ ] GitHub account
- [ ] Railway account (sign up at https://railway.app)
- [ ] Node.js backend code in a Git repository
- [ ] Clerk account with API keys
- [ ] Payment method added to Railway (required even for free tier)

---

## 3. Project Structure (Recommended)

Your repository should look like this:

```
writerstree/
├── backend/                  # Backend API
│   ├── src/
│   │   ├── server.ts        # Main server file
│   │   ├── database.ts      # Database connection
│   │   ├── middleware/
│   │   │   └── clerkAuth.ts
│   │   ├── routes/
│   │   │   ├── users.ts
│   │   │   ├── projects.ts
│   │   │   └── webhooks.ts
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example         # Template for env vars
├── client/                   # Frontend (React)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 4. Prepare Backend for Deployment

### 4.1 Update package.json

**backend/package.json**

```json
{
  "name": "writerstree-api",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "node dist/migrate.js"
  },
  "dependencies": {
    "@clerk/clerk-sdk-node": "^5.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "svix": "^1.15.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/pg": "^8.10.9",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 4.2 Create Build Configuration

**backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.3 Update Server Port Configuration

**backend/src/server.ts**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// IMPORTANT: Use PORT from environment (Railway provides this)
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Railway will set this
  credentials: true,
}));

app.use(express.json());

// Health check endpoint (Railway uses this)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Your routes
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/webhooks', require('./routes/webhooks'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
```

### 4.4 Create Environment Variables Template

**backend/.env.example**

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (Railway will provide this automatically)
DATABASE_URL=postgresql://user:password@host:port/database

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Frontend URL (for CORS)
FRONTEND_URL=https://writerstree.com

# Optional: Redis (if using caching)
REDIS_URL=redis://host:port
```

### 4.5 Create .gitignore

**backend/.gitignore**

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.production

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/

# Misc
.cache/
```

---

## 5. Railway Deployment Steps

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click **"Start a New Project"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub repositories
4. Add payment method (required even for free tier)
   - **Don't worry**: You get $5/month free credit
   - You won't be charged unless you exceed free tier

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `your-username/writerstree`
4. Railway will detect your project structure

**If you have a monorepo (backend + frontend):**
- Railway will ask which folder to deploy
- Select `backend` folder
- Set root directory: `backend`

### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically provisions a PostgreSQL instance
4. Database credentials are auto-generated and added to environment variables

**You'll see:**
- `DATABASE_URL` - Automatically set (you don't need to configure this!)
- Database dashboard with connection info

### Step 4: Configure Environment Variables

1. Click on your backend service (not the database)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add each one:

```bash
NODE_ENV=production

# Clerk (get from https://dashboard.clerk.com)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Frontend URL (you'll deploy frontend separately)
FRONTEND_URL=https://writerstree.com
```

**Important Notes:**
- `DATABASE_URL` is automatically set by Railway (don't add manually)
- `PORT` is automatically set by Railway (don't add manually)
- Use **production** Clerk keys (pk_live_, sk_live_), not test keys

### Step 5: Configure Build Settings

1. Click on your backend service
2. Go to **"Settings"** tab
3. Scroll to **"Build"** section
4. Set:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
   - **Root Directory:** `backend` (if monorepo)
   - **Watch Paths:** `backend/**` (if monorepo)

### Step 6: Deploy

1. Click **"Deploy"** button (or push to GitHub)
2. Railway will:
   - Install dependencies (`npm install`)
   - Build TypeScript (`npm run build`)
   - Start server (`npm run start`)

**Watch the build logs:**
- Click **"Deployments"** tab
- Click on latest deployment
- View real-time logs

**Expected logs:**
```
Installing dependencies...
Building TypeScript...
Build successful!
Starting server...
🚀 Server running on port 8080
🌍 Environment: production
💚 Health check: http://localhost:8080/health
```

### Step 7: Get Your API URL

1. Go to **"Settings"** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Railway creates a URL like: `https://writerstree-api-production.up.railway.app`

**Test it:**
```bash
curl https://writerstree-api-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T10:30:00.000Z",
  "environment": "production"
}
```

---

## 6. Database Setup & Migrations

### 6.1 Create Migration Script

**backend/src/migrate.ts**

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        profile_image_url TEXT,
        clerk_created_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        preferences JSONB DEFAULT '{}',
        subscription_tier VARCHAR(50) DEFAULT 'free',
        subscription_expires_at TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
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
    `);
    console.log('✅ Projects table created');

    // Create project_content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        word_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        is_current BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('✅ Project content table created');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_project_content_project_id ON project_content(project_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Indexes created');

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

### 6.2 Run Migrations on Railway

**Option A: Run Manually (Recommended for first time)**

1. Go to Railway project dashboard
2. Click on your backend service
3. Click **"Settings"** → **"Service"**
4. Under **"Custom Start Command"**, temporarily change to:
   ```
   npm run migrate && npm run start
   ```
5. Redeploy
6. Check logs - you should see:
   ```
   🔄 Running database migrations...
   ✅ Users table created
   ✅ Projects table created
   ...
   🚀 Server running on port 8080
   ```

**Option B: Create Separate Migration Service**

1. Click **"+ New"** in your project
2. Select **"Empty Service"**
3. Name it: `migrations`
4. Set environment variable: `DATABASE_URL` (copy from your database)
5. Set start command: `npm run migrate`
6. Deploy once, then pause the service (it only needs to run once)

### 6.3 Verify Database

1. In Railway dashboard, click on **PostgreSQL** database
2. Click **"Data"** tab
3. You should see your tables: `users`, `projects`, `project_content`

**Or use Railway CLI:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to database
railway run psql $DATABASE_URL

# List tables
\dt

# Exit
\q
```

---

## 7. Configure Clerk Webhooks

Now that your backend is deployed, update Clerk to send webhooks to Railway:

1. Go to https://dashboard.clerk.com
2. Navigate to **Webhooks**
3. Click **"Add Endpoint"**
4. Enter Railway URL:
   ```
   https://writerstree-api-production.up.railway.app/api/webhooks/clerk
   ```
5. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
   - ✅ `session.created`
6. Copy the **Signing Secret**
7. Go back to Railway → Variables → Add:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxx
   ```
8. Railway will automatically redeploy with new variable

### Test Webhook

1. In Clerk Dashboard → Webhooks → Your Endpoint
2. Click **"Testing"** tab
3. Click **"Send Test Event"**
4. Check Railway logs (Deployments → Latest → Logs):
   ```
   Webhook received: user.created
   Creating user: user_2abc123
   User created successfully
   ```

---

## 8. Custom Domain (Optional)

### 8.1 Add Custom Domain to Railway

1. In Railway project, click backend service
2. Go to **"Settings"** → **"Domains"**
3. Click **"Custom Domain"**
4. Enter: `api.writerstree.com`
5. Railway will show DNS records to add

### 8.2 Configure DNS

Go to your domain provider (Namecheap, Cloudflare, etc.):

**Add CNAME record:**
```
Type:  CNAME
Name:  api
Value: writerstree-api-production.up.railway.app
TTL:   Auto
```

Wait 5-60 minutes for DNS propagation.

### 8.3 Update Environment Variables

Once domain is active:

**Railway Variables:**
```bash
# No change needed - Railway handles domain automatically
```

**Clerk Webhook:**
- Update URL to: `https://api.writerstree.com/api/webhooks/clerk`

**Frontend .env:**
```bash
VITE_API_URL=https://api.writerstree.com
```

---

## 9. Monitoring & Logs

### 9.1 View Logs

**Real-time logs:**
1. Railway Dashboard → Your Service
2. Click **"Deployments"** → Latest deployment
3. View streaming logs

**Filter logs:**
- Click **"Filters"** icon
- Select log level (Info, Error, etc.)
- Search for keywords

### 9.2 Set Up Alerts (Pro Plan)

1. Go to **"Observability"**
2. Click **"Alerts"**
3. Create alert rules:
   - CPU > 80%
   - Memory > 90%
   - Crash detection
   - Deploy failures

### 9.3 Database Metrics

1. Click on PostgreSQL service
2. Go to **"Metrics"** tab
3. View:
   - Connections
   - Query performance
   - Storage usage
   - Memory usage

---

## 10. Scaling & Optimization

### 10.1 Vertical Scaling

As your app grows, upgrade Railway plan:

**Free Tier:**
- 512MB RAM
- 1GB storage
- $5/month credit

**Hobby Plan ($5/month):**
- Up to 8GB RAM
- Up to 100GB storage
- Priority support

**Pro Plan ($20/month):**
- Up to 32GB RAM
- Up to 500GB storage
- Team collaboration
- Observability

### 10.2 Connection Pooling

**Update database.ts:**

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000,
});

export default pool;
```

### 10.3 Add Redis Caching (Optional)

1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"Redis"**
3. Railway provisions Redis and sets `REDIS_URL`
4. Use for caching frequently accessed data

---

## 11. Troubleshooting Common Issues

### Issue 1: Build Fails

**Symptoms:** Deployment fails during build

**Solutions:**
```bash
# Check package.json has correct scripts
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js"
}

# Verify tsconfig.json outDir matches start command
"outDir": "./dist"

# Check Railway build logs for specific error
```

### Issue 2: Database Connection Fails

**Symptoms:** `Error: connection refused` or `ECONNREFUSED`

**Solutions:**
```typescript
// Ensure SSL is enabled for production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// Check DATABASE_URL is set in Railway variables
console.log('DB URL:', process.env.DATABASE_URL?.substring(0, 20));
```

### Issue 3: Webhooks Not Working

**Symptoms:** Clerk webhooks fail or timeout

**Solutions:**
1. Check webhook URL is correct (no typos)
2. Verify `CLERK_WEBHOOK_SECRET` is set in Railway
3. Ensure webhook handler uses `express.raw()`:
   ```typescript
   app.post('/api/webhooks/clerk', 
     express.raw({ type: 'application/json' }),
     webhookHandler
   );
   ```
4. Check Railway logs for incoming webhook requests

### Issue 4: CORS Errors

**Symptoms:** Frontend can't connect to API

**Solutions:**
```typescript
// Update CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Set FRONTEND_URL in Railway variables
FRONTEND_URL=https://writerstree.com
```

### Issue 5: Port Already in Use

**Symptoms:** `Error: listen EADDRINUSE`

**Solutions:**
```typescript
// Always use process.env.PORT (Railway sets this)
const PORT = process.env.PORT || 3000;

// Never hardcode port
// ❌ app.listen(3000)
// ✅ app.listen(PORT)
```

---

## 12. Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `.env.example` created (no secrets!)
- [ ] `.gitignore` includes `.env`
- [ ] `package.json` has `build` and `start` scripts
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Server uses `process.env.PORT`
- [ ] Database uses `process.env.DATABASE_URL`

### Railway Setup
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Build settings configured
- [ ] First deployment successful

### Post-Deployment
- [ ] Health check endpoint works
- [ ] Database migrations ran successfully
- [ ] Clerk webhooks configured and tested
- [ ] API endpoints return expected responses
- [ ] Logs show no errors
- [ ] Custom domain configured (if using)
- [ ] Frontend connected to production API

---

## 13. Quick Commands Reference

```bash
# Railway CLI
railway login                    # Login to Railway
railway link                     # Link to project
railway logs                     # View logs
railway run psql $DATABASE_URL   # Connect to database
railway status                   # Check service status
railway up                       # Deploy latest changes

# Database
railway run psql $DATABASE_URL
\dt                              # List tables
\d users                         # Describe users table
SELECT * FROM users;             # Query users

# Testing
curl https://your-app.railway.app/health
curl https://your-app.railway.app/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 14. Cost Estimation

**Free Tier (First Month):**
- Backend service: ~$3/month
- PostgreSQL: ~$2/month
- **Total**: ~$5/month = **FREE** (with $5 credit)

**After Free Credit:**
- **Hobby Plan**: $5/month (covers both services)
- **Pro Plan**: $20/month (for production)

**Tips to Stay Free:**
- Use sleep mode for dev environments
- Delete unused deployments
- Optimize database queries
- Use caching to reduce DB load

---

**You're all set!** Your backend is now deployed on Railway with PostgreSQL, ready to handle authentication, projects, and auto-save. 🚀

Next step: Deploy your frontend (Vercel/Netlify) and connect it to this API!