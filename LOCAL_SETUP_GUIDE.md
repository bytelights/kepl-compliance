# LOCAL SETUP GUIDE - Compliance Management System

**ByteLights Private Limited**  
**Complete Step-by-Step Guide to Run Project Locally**

---

## 📋 Prerequisites

Before starting, ensure you have installed:

- ✅ **Node.js** 20.19.0+ (check: `node --version`)
- ✅ **PNPM** (check: `pnpm --version`, install: `npm install -g pnpm`)
- ✅ **Docker** & **Docker Compose** (check: `docker --version`)
- ✅ **Supabase CLI** (check: `supabase --version`)
- ✅ **Git** (check: `git --version`)

---

## 🚀 PART 1: SUPABASE LOCAL SETUP

### Step 1.1: Install Supabase CLI (if not installed)

```bash
# macOS
brew install supabase/tap/supabase

# OR using npm
npm install -g supabase

# Verify installation
supabase --version
```

### Step 1.2: Initialize Supabase in Project

```bash
# Navigate to project root
cd /Users/krishna/Documents/bytelights/kelp

# Start Supabase local instance (uses Docker)
supabase start

# This will:
# - Start PostgreSQL database (port 54322)
# - Start Supabase Studio (port 54323)
# - Start Auth service
# - Show you the connection credentials
```

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:** Save these credentials! You'll need the `DB URL`.

### Step 1.3: Access Supabase Studio

Open browser: `http://localhost:54323`

This is your local database GUI where you can:
- View tables
- Run SQL queries
- Manage data

---

## 🔧 PART 2: BACKEND SETUP (NestJS)

### Step 2.1: Create Environment File

```bash
cd apps/backend-nest

# Copy example file
cp .env.example .env

# Open .env in your editor
nano .env
# OR
code .env
```

### Step 2.2: Configure Environment Variables

**Edit `apps/backend-nest/.env`** with these values:

```bash
# ============================================
# DATABASE (from Supabase start command)
# ============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# ============================================
# MICROSOFT AZURE AD (from client)
# ============================================
# Replace these with actual values from client
MICROSOFT_CLIENT_ID="your-client-id-from-client"
MICROSOFT_CLIENT_SECRET="your-client-secret-from-client"
MICROSOFT_TENANT_ID="your-tenant-id-from-client"

# Redirect URI (local development)
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long-change-this-in-production"
JWT_EXPIRES_IN="7d"

# ============================================
# SHAREPOINT (from client - optional for now)
# ============================================
SHAREPOINT_TENANT_ID="your-tenant-id-from-client"
SHAREPOINT_SITE_ID="your-site-id-from-client"
SHAREPOINT_DRIVE_ID="your-drive-id-from-client"

# ============================================
# TEAMS (optional for now)
# ============================================
# TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/your-webhook-url"

# ============================================
# FRONTEND URL (for CORS)
# ============================================
FRONTEND_URL="http://localhost:4200"

# ============================================
# ENCRYPTION (for config values)
# ============================================
ENCRYPTION_KEY="your-32-character-encryption-key-change-this"

# ============================================
# SERVER
# ============================================
PORT=3000
NODE_ENV=development
```

### Step 2.3: Install Backend Dependencies

```bash
# Make sure you're in project root
cd /Users/krishna/Documents/bytelights/kelp

# Install all dependencies (backend + frontend + shared packages)
pnpm install
```

### Step 2.4: Generate Prisma Client

```bash
cd apps/backend-nest

# Generate Prisma client from schema
npx prisma generate
```

### Step 2.5: Run Database Migration

```bash
# Still in apps/backend-nest

# Create database tables
npx prisma migrate dev --name init

# This will:
# - Create all tables (users, tasks, entities, etc.)
# - Create indexes
# - Create constraints
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Applied 1 migration in 234ms
Database synchronized with Prisma schema.
```

### Step 2.6: Seed Database (Optional but Recommended)

```bash
# Still in apps/backend-nest

# Run seed script
npm run seed
```

**Expected Output:**
```
🌱 Seeding database...

✅ Created admin user: admin@example.com
✅ Created reviewer user: reviewer@example.com
✅ Created task owner user: taskowner@example.com
✅ Created sample master data
   - Entity: Corporate Office
   - Department: Legal
   - Law: Companies Act 2013
✅ Created sample compliance master: Board Meeting Minutes

🎉 Seed completed successfully!

📧 Default user credentials:
  Admin:      admin@example.com
  Reviewer:   reviewer@example.com
  Task Owner: taskowner@example.com

💡 Use Microsoft SSO to login with these emails
```

### Step 2.7: Start Backend Server

```bash
# In apps/backend-nest

# Development mode (with hot reload)
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 01/24/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/24/2026, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/24/2026, 10:30:01 AM     LOG [RoutesResolver] TasksController {/tasks}
[Nest] 12345  - 01/24/2026, 10:30:01 AM     LOG [RouterExplorer] Mapped {/tasks, GET} route
[Nest] 12345  - 01/24/2026, 10:30:01 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 01/24/2026, 10:30:01 AM     LOG Application listening on http://localhost:3000
```

### Step 2.8: Verify Backend is Running

Open browser or use curl:

```bash
# Test health endpoint
curl http://localhost:3000

# OR open in browser
open http://localhost:3000
```

**Backend is now running on:** `http://localhost:3000` ✅

---

## 🎨 PART 3: FRONTEND SETUP (Angular)

### Step 3.1: Configure Frontend Environment

```bash
cd apps/frontend-angular

# Check if environment file exists
ls src/environments/
```

**Edit `src/environments/environment.ts`:**

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  msalConfig: {
    auth: {
      clientId: 'your-client-id-from-client', // Same as backend
      authority: 'https://login.microsoftonline.com/your-tenant-id-from-client',
      redirectUri: 'http://localhost:4200/auth/callback',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
  },
};
```

**Edit `src/environments/environment.development.ts`** (same values as above)

### Step 3.2: Install Frontend Dependencies (if not done)

```bash
# Should already be installed from root pnpm install
# But if needed:
cd /Users/krishna/Documents/bytelights/kelp
pnpm install
```

### Step 3.3: Start Frontend Server

```bash
cd apps/frontend-angular

# Start Angular dev server
npm run start

# OR
npx ng serve
```

**Expected Output:**
```
Initial chunk files | Names         |  Raw size
polyfills.js        | polyfills     |  82.00 kB | 
main.js             | main          | 250.00 kB | 
styles.css          | styles        |  50.00 kB | 

Build at: 2026-01-24T10:35:00.000Z - Hash: abc123def456

✔ Compiled successfully.
✔ Browser application bundle generation complete.

Angular Live Development Server is listening on localhost:4200
```

**Frontend is now running on:** `http://localhost:4200` ✅

---

## 👥 PART 4: DEMO USERS SETUP

### Step 4.1: Configure Azure AD Demo Users

**Ask client to provide:**

1. **Two demo user emails** (e.g., `demo1@clientdomain.com`, `demo2@clientdomain.com`)
2. **Tenant ID** (already in .env)
3. **Client ID** (already in .env)
4. **Client Secret** (already in .env)

### Step 4.2: Add Demo Users to Database

**Option A: Using Supabase Studio**

1. Open `http://localhost:54323`
2. Go to "Table Editor" → "users"
3. Click "Insert row"
4. Add demo user:
   ```
   email: demo1@clientdomain.com
   name: Demo User 1
   role: admin
   isActive: true
   ```
5. Repeat for demo2

**Option B: Using SQL**

Open Supabase Studio SQL Editor and run:

```sql
-- Insert demo user 1 (Admin)
INSERT INTO users (id, email, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo1@clientdomain.com',
  'Demo Admin User',
  'admin',
  true,
  NOW(),
  NOW()
);

-- Insert demo user 2 (Reviewer)
INSERT INTO users (id, email, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'demo2@clientdomain.com',
  'Demo Reviewer User',
  'reviewer',
  true,
  NOW(),
  NOW()
);
```

### Step 4.3: Test Demo User Login

1. Open `http://localhost:4200`
2. Click "Login with Microsoft"
3. Sign in with `demo1@clientdomain.com` (client's Azure AD credentials)
4. You'll be redirected back to app after SSO
5. Should see dashboard based on user role

---

## 🧪 PART 5: VERIFY EVERYTHING IS WORKING

### Checklist:

```bash
# 1. Supabase running?
curl http://localhost:54323
# Should show Supabase Studio

# 2. Backend API running?
curl http://localhost:3000
# Should return API response

# 3. Frontend running?
curl http://localhost:4200
# Should return Angular app

# 4. Database tables created?
# Open Supabase Studio: http://localhost:54323
# Check tables: users, entities, departments, laws, compliance_tasks, etc.

# 5. Seed data present?
# Open Supabase Studio → users table
# Should see: admin@example.com, reviewer@example.com, taskowner@example.com
```

### Test Key Flows:

**1. Authentication Flow:**
```
http://localhost:4200 
→ Click "Login" 
→ Microsoft SSO 
→ Login with demo user 
→ Redirected to dashboard ✅
```

**2. View Tasks:**
```
Dashboard → Navigate to "Tasks" → Should see empty list or seeded tasks ✅
```

**3. Create Master Data:**
```
Navigate to "Master Data" → Create Entity/Department/Law ✅
```

**4. Create Task:**
```
Navigate to "Tasks" → Click "Create Task" → Fill form → Submit ✅
```

---

## 🐳 PART 6: DOCKER COMPOSE (ALTERNATIVE TO SUPABASE CLI)

If you prefer Docker Compose instead of Supabase CLI:

### Step 6.1: Create docker-compose.yml

**Create file:** `/Users/krishna/Documents/bytelights/kelp/docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    container_name: compliance_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: compliance_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Step 6.2: Start Docker Compose

```bash
# In project root
docker-compose up -d

# Check if running
docker-compose ps
```

### Step 6.3: Update DATABASE_URL

**Edit `apps/backend-nest/.env`:**

```bash
# Change from Supabase URL to Docker URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/compliance_db"
```

Then continue with Step 2.4 onwards (Prisma migrate, seed, etc.)

---

## 📝 COMMON ISSUES & SOLUTIONS

### Issue 1: Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# OR use different port
PORT=3001 npm run start:dev
```

### Issue 2: Supabase Won't Start

**Error:** `Docker daemon not running`

**Solution:**
```bash
# Start Docker Desktop app
open /Applications/Docker.app

# Wait for Docker to start, then:
supabase start
```

### Issue 3: Prisma Migration Fails

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check DATABASE_URL is correct
cat apps/backend-nest/.env | grep DATABASE_URL

# Test connection
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# If successful, try migration again
npx prisma migrate dev --name init
```

### Issue 4: Microsoft SSO Not Working

**Error:** `AADSTS50011: The reply URL specified does not match`

**Solution:**
1. Check Azure AD App Registration
2. Add redirect URI: `http://localhost:3000/auth/microsoft/callback`
3. Add frontend redirect: `http://localhost:4200/auth/callback`
4. Save changes in Azure portal
5. Wait 5 minutes for propagation
6. Try again

### Issue 5: Frontend Can't Connect to Backend

**Error:** `CORS error` or `ERR_CONNECTION_REFUSED`

**Solution:**
```bash
# 1. Check backend is running
curl http://localhost:3000

# 2. Check FRONTEND_URL in backend .env
# Should be: FRONTEND_URL="http://localhost:4200"

# 3. Restart backend
cd apps/backend-nest
npm run start:dev
```

---

## 🎯 QUICK START SUMMARY

**For quick setup after first time:**

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Backend
cd apps/backend-nest
npm run start:dev

# Terminal 3: Start Frontend
cd apps/frontend-angular
npm run start

# Done! 🎉
# Backend: http://localhost:3000
# Frontend: http://localhost:4200
# Supabase Studio: http://localhost:54323
```

---

## 📱 ACCESSING THE APPLICATION

### URLs:

- **Frontend App:** `http://localhost:4200`
- **Backend API:** `http://localhost:3000`
- **API Documentation:** `http://localhost:3000/api` (if Swagger enabled)
- **Supabase Studio:** `http://localhost:54323`

### Demo Credentials:

**Pre-seeded Users (use with Microsoft SSO):**
- Admin: `admin@example.com`
- Reviewer: `reviewer@example.com`
- Task Owner: `taskowner@example.com`

**Client Demo Users (from Azure AD):**
- Demo 1: `demo1@clientdomain.com`
- Demo 2: `demo2@clientdomain.com`

---

## 🔄 STOPPING SERVICES

```bash
# Stop Frontend (Ctrl+C in terminal)
# Stop Backend (Ctrl+C in terminal)

# Stop Supabase
supabase stop

# OR stop Docker Compose (if using)
docker-compose down
```

---

## 📚 ADDITIONAL RESOURCES

### Useful Commands:

```bash
# View Supabase logs
supabase logs

# Reset Supabase database
supabase db reset

# View Prisma Studio (database GUI)
cd apps/backend-nest
npx prisma studio

# Backend logs
cd apps/backend-nest
npm run start:dev | tee logs.txt

# Frontend logs
cd apps/frontend-angular
npm run start | tee logs.txt
```

### Database Access:

```bash
# Connect to Supabase PostgreSQL
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Run SQL query
\dt  # List tables
\d users  # Describe users table
SELECT * FROM users;  # Query users
```

---

## ✅ SETUP COMPLETE!

**You now have:**
- ✅ Supabase running locally
- ✅ Backend API running on port 3000
- ✅ Frontend app running on port 4200
- ✅ Database seeded with sample data
- ✅ Microsoft SSO configured
- ✅ Demo users ready to test

**Next Steps:**
1. Test authentication with demo users
2. Create tasks
3. Upload evidence to SharePoint
4. Try CSV import
5. Test Teams integration
6. Generate reports

---

**Need Help?**
- Check logs in terminal
- Open Supabase Studio to inspect database
- Use browser DevTools (F12) to debug frontend
- Check backend logs for API errors

---

*ByteLights Private Limited - Compliance Management System*  
*Local Development Setup - Complete Guide*
