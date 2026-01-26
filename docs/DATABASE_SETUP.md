# Database Setup Guide

This guide covers setting up PostgreSQL and Redis using Docker for the WritersTree backend.

---

## Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Node.js 20.x installed
- Git (for cloning the repository)

---

## Quick Start

### 1. Start Database Services

```bash
# Navigate to server directory
cd server

# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

**Expected output:**
```
NAME                    STATUS              PORTS
writerstree-postgres    Up (healthy)        0.0.0.0:5432->5432/tcp
writerstree-redis       Up (healthy)        0.0.0.0:6379->6379/tcp
```

### 2. Configure Environment Variables

Create `.env` file in `server/` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://writerstree:writerstree_password@localhost:5432/writerstree_db
POSTGRES_USER=writerstree
POSTGRES_PASSWORD=writerstree_password
POSTGRES_DB=writerstree_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3000
NODE_ENV=development

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# JWT (for WebSocket tokens)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
# Create tables and schema
npm run db:migrate

# Or manually with psql
docker exec -i writerstree-postgres psql -U writerstree -d writerstree_db < migrations/001_initial_schema.sql
```

### 5. Start Backend Server

```bash
npm run dev
```

**Server should start on:** `http://localhost:3000`

---

## Docker Services Details

### PostgreSQL Container

- **Image**: `postgres:16-alpine`
- **Port**: `5432` (mapped to host)
- **Volume**: `postgres_data` (persists data)
- **Health Check**: Runs every 10s
- **Initialization**: Executes `init.sql` on first start

**Access PostgreSQL:**
```bash
# Using docker exec
docker exec -it writerstree-postgres psql -U writerstree -d writerstree_db

# Using local psql client (if installed)
psql -h localhost -p 5432 -U writerstree -d writerstree_db
```

**Common PostgreSQL commands:**
```sql
-- List all databases
\l

-- Connect to database
\c writerstree_db

-- List all tables
\dt

-- Describe table schema
\d projects

-- View table data
SELECT * FROM projects;

-- Exit psql
\q
```

### Redis Container

- **Image**: `redis:7-alpine`
- **Port**: `6379` (mapped to host)
- **Volume**: `redis_data` (persists data)
- **Persistence**: AOF (Append Only File) enabled
- **Health Check**: PING command every 10s

**Access Redis:**
```bash
# Using docker exec
docker exec -it writerstree-redis redis-cli

# Test connection
PING
# Returns: PONG

# View all keys
KEYS *

# Get value
GET user:123:preferences

# Set value
SET test:key "hello"

# Exit
exit
```

---

## Docker Compose Commands

### Start Services
```bash
# Start in background (detached mode)
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d postgres
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Stop specific service
docker-compose stop postgres
```

### View Logs
```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs postgres
docker-compose logs redis

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart postgres
```

### Check Status
```bash
# View running containers
docker-compose ps

# View resource usage
docker stats writerstree-postgres writerstree-redis
```

---

## Database Migrations

### Migration Files Location
```
server/migrations/
├── 001_initial_schema.sql
├── 002_add_analytics.sql
└── 003_add_exports.sql
```

### Running Migrations

**Option 1: Using npm script**
```bash
npm run db:migrate
```

**Option 2: Manual execution**
```bash
# Single migration file
docker exec -i writerstree-postgres psql -U writerstree -d writerstree_db < migrations/001_initial_schema.sql

# All migrations in order
for file in migrations/*.sql; do
  echo "Running $file..."
  docker exec -i writerstree-postgres psql -U writerstree -d writerstree_db < "$file"
done
```

**Option 3: Using psql directly**
```bash
# Connect to container
docker exec -it writerstree-postgres psql -U writerstree -d writerstree_db

# Run migration from inside container
\i /docker-entrypoint-initdb.d/001_initial_schema.sql
```

### Creating New Migrations

1. Create new file: `migrations/004_your_migration_name.sql`
2. Add SQL statements:
```sql
-- migrations/004_add_comments.sql

BEGIN;

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

COMMIT;
```
3. Run migration: `npm run db:migrate`

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs postgres
docker-compose logs redis
```

**Common issues:**
- Port already in use: Change port in `docker-compose.yml`
- Permission denied: Run `docker-compose down -v` and restart
- Out of disk space: Run `docker system prune -a`

### Database Connection Errors

**Verify container is running:**
```bash
docker-compose ps
```

**Test connection:**
```bash
# PostgreSQL
docker exec writerstree-postgres pg_isready -U writerstree

# Redis
docker exec writerstree-redis redis-cli ping
```

**Check environment variables:**
```bash
# In .env file
echo $DATABASE_URL
```

**Restart services:**
```bash
docker-compose restart
```

### Migration Errors

**Check migration syntax:**
```sql
-- Always wrap in transaction
BEGIN;
-- your SQL here
COMMIT;
```

**View migration history:**
```sql
-- Connect to database
docker exec -it writerstree-postgres psql -U writerstree -d writerstree_db

-- Check if table exists
\dt

-- View schema
\d projects
```

**Rollback migration:**
```sql
-- Create rollback file
-- migrations/004_rollback_comments.sql
BEGIN;
DROP TABLE IF EXISTS comments;
COMMIT;
```

### Volume Cleanup

**List volumes:**
```bash
docker volume ls
```

**Remove specific volume:**
```bash
docker volume rm writerstree_postgres_data
docker volume rm writerstree_redis_data
```

**Remove all unused volumes:**
```bash
docker volume prune
```

### Reset Database (Fresh Start)

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start containers
docker-compose up -d

# Wait for healthy status
docker-compose ps

# Run migrations
npm run db:migrate
```

---

## Production Deployment

### Environment Variables for Production

```env
# Production Database (use managed service)
DATABASE_URL=postgresql://user:password@db.example.com:5432/writerstree_prod

# Redis (use managed service like Redis Cloud)
REDIS_URL=redis://:password@redis.example.com:6379

# SSL for PostgreSQL
DATABASE_SSL=true

# Redis TLS
REDIS_TLS=true

# Other production settings
NODE_ENV=production
LOG_LEVEL=warn
```

### Managed Services (Recommended)

**PostgreSQL:**
- AWS RDS PostgreSQL
- Azure Database for PostgreSQL
- Google Cloud SQL
- Supabase
- Neon

**Redis:**
- AWS ElastiCache
- Azure Cache for Redis
- Google Cloud Memorystore
- Redis Cloud
- Upstash

### Backup Strategy

**PostgreSQL Backup:**
```bash
# Manual backup
docker exec writerstree-postgres pg_dump -U writerstree writerstree_db > backup.sql

# Restore backup
docker exec -i writerstree-postgres psql -U writerstree -d writerstree_db < backup.sql

# Automated daily backup (cron job)
0 2 * * * docker exec writerstree-postgres pg_dump -U writerstree writerstree_db > /backups/db-$(date +\%Y\%m\%d).sql
```

**Redis Backup:**
```bash
# Save snapshot
docker exec writerstree-redis redis-cli BGSAVE

# Copy RDB file
docker cp writerstree-redis:/data/dump.rdb ./backup/

# Restore
docker cp ./backup/dump.rdb writerstree-redis:/data/
docker-compose restart redis
```

---

## Performance Tuning

### PostgreSQL

**Connection Pooling (already configured in code):**
```javascript
// src/config/database.js
const pool = new Pool({
  max: 20,                 // Maximum pool size
  min: 5,                  // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if no connection
});
```

**Database Indexes (already in migrations):**
```sql
-- Indexes for common queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
```

### Redis

**Memory Limit:**
```yaml
# docker-compose.yml
services:
  redis:
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

**Monitor Memory:**
```bash
docker exec writerstree-redis redis-cli INFO memory
```

---

## Monitoring

### Health Checks

**Backend API:**
```bash
curl http://localhost:3000/health
```

**PostgreSQL:**
```bash
docker exec writerstree-postgres pg_isready -U writerstree
```

**Redis:**
```bash
docker exec writerstree-redis redis-cli ping
```

### View Resource Usage

```bash
# CPU and Memory usage
docker stats writerstree-postgres writerstree-redis

# Disk usage
docker exec writerstree-postgres df -h

# Database size
docker exec writerstree-postgres psql -U writerstree -d writerstree_db -c "SELECT pg_size_pretty(pg_database_size('writerstree_db'));"
```

---

## Next Steps

1. ✅ Docker containers are running
2. ✅ Migrations are executed
3. Install Redis client: `npm install redis`
4. Create Redis service (see `REDIS_SETUP.md`)
5. Test API endpoints with Postman/curl
6. Set up frontend to connect to backend
7. Configure Clerk authentication
8. Deploy to production (see deployment guide)

**Verify everything is working:**
```bash
# Check containers
docker-compose ps

# Check backend server
curl http://localhost:3000/health

# Check database connection
docker exec writerstree-postgres psql -U writerstree -d writerstree_db -c "SELECT COUNT(*) FROM projects;"

# Check Redis connection
docker exec writerstree-redis redis-cli ping
```

All backend database infrastructure is now ready! 🚀
