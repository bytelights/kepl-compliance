# Testing & Deployment Guide

## 🧪 Local Testing

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Generate Prisma Client
```bash
cd apps/backend-nest
npx prisma generate
```

### Step 3: Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Minimum Required Variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/compliance_db"
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id"
JWT_SECRET="your-jwt-secret"
SESSION_SECRET="your-session-secret"
ENCRYPTION_KEY="your-32-char-encryption-key"
```

### Step 4: Database Setup
```bash
# Run migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

**This creates:**
- Default workspace
- Admin user: `admin@example.com`
- Reviewer user: `reviewer@example.com`
- Sample master data

### Step 5: Start Development Servers
```bash
# From project root
cd ../..

# Start both backend and frontend
pnpm dev

# OR start separately:
pnpm backend:dev   # Port 3000
pnpm frontend:dev  # Port 4200
```

---

## ✅ API Testing

### Test Authentication
```bash
# Test login redirect
curl -i http://localhost:3000/api/auth/microsoft/login

# Expected: 302 redirect to Microsoft
```

### Test After Login
```bash
# Get current user (needs cookie from browser)
curl -b cookies.txt http://localhost:3000/api/auth/me

# List users (admin only)
curl -b cookies.txt http://localhost:3000/api/users

# List entities
curl -b cookies.txt http://localhost:3000/api/master/entities

# List tasks
curl -b cookies.txt http://localhost:3000/api/tasks
```

### Test CRUD Operations
```bash
# Create entity (admin only)
curl -X POST http://localhost:3000/api/master/entities \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"New Entity"}'

# Create task (admin/reviewer)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "complianceId":"COMP-001",
    "title":"Test Task",
    "lawId":"...",
    "departmentId":"...",
    "entityId":"...",
    "ownerId":"...",
    "reviewerId":"...",
    "dueDate":"2024-12-31"
  }'
```

---

## 🎯 Feature Testing Checklist

### Authentication ✅
- [ ] Navigate to http://localhost:4200
- [ ] Click "Sign in with Microsoft"
- [ ] Redirected to Microsoft login
- [ ] After login, see dashboard
- [ ] User role displayed correctly

### Task Owner Features ✅
- [ ] View "My Dashboard" with stats
- [ ] See only assigned tasks
- [ ] Upload evidence to task
- [ ] Complete task (requires evidence + comment)
- [ ] Skip task (requires remarks)

### Reviewer Features ✅
- [ ] View all tasks workspace-wide
- [ ] Create new task
- [ ] Assign task to owner
- [ ] Edit task details
- [ ] View audit logs

### Admin Features ✅
- [ ] Manage user roles
- [ ] CRUD master data
- [ ] Upload CSV (preview mode)
- [ ] Upload CSV (commit mode)
- [ ] View import history with errors
- [ ] Configure SharePoint
- [ ] Test SharePoint connection
- [ ] Configure Teams webhook
- [ ] Test Teams webhook
- [ ] Send test report
- [ ] View audit logs
- [ ] View admin dashboard

### SharePoint Evidence ✅
- [ ] Upload session created
- [ ] File uploaded to correct folder structure
- [ ] Evidence listed in task
- [ ] Evidence can be deleted (with role check)

### CSV Import ✅
- [ ] Preview CSV (validation only)
- [ ] See validation errors
- [ ] Commit CSV (creates tasks)
- [ ] View import job history
- [ ] Download error report

---

## 🚀 Production Deployment

### Prerequisites
1. **Database**: PostgreSQL (Supabase recommended)
2. **Microsoft Entra ID**: Registered app
3. **SharePoint**: Site with document library
4. **Teams**: Incoming webhook
5. **Hosting**: Node.js 18+ server

### Step 1: Build Applications
```bash
# Build backend
pnpm --filter backend-nest build

# Build frontend
pnpm --filter frontend-angular build
```

### Step 2: Environment Configuration
```env
# Production .env
NODE_ENV=production
DATABASE_URL="postgresql://..."
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
MICROSOFT_REDIRECT_URI="https://your-domain.com/auth/microsoft/callback"
FRONTEND_URL="https://your-domain.com"
JWT_SECRET="strong-secret"
SESSION_SECRET="strong-secret"
ENCRYPTION_KEY="32-character-key"
```

### Step 3: Run Migrations
```bash
pnpm --filter backend-nest db:migrate:deploy
```

### Step 4: Update Seed Script
Edit `apps/backend-nest/prisma/seed.ts`:
```typescript
// Change to actual admin/reviewer emails
email: 'actual-admin@yourcompany.com',
email: 'actual-reviewer@yourcompany.com',
```

Run seed:
```bash
pnpm db:seed
```

### Step 5: Start Production
```bash
# Backend
cd apps/backend-nest
pnpm start:prod

# Frontend (serve static files)
# Use nginx or similar to serve apps/frontend-angular/dist/
```

---

## 🐳 Docker Deployment

### Create Dockerfile (Backend)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter backend-nest build
RUN npx prisma generate
CMD ["pnpm", "start:prod"]
EXPOSE 3000
```

### Create docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: compliance_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/compliance_db
    depends_on:
      - postgres

volumes:
  postgres-data:
```

---

## 📊 Performance Monitoring

### Database Queries
```bash
# Check slow queries
pnpm db:studio

# View indexes
npx prisma db pull
```

### API Performance
```bash
# Test response times
curl -w "@curl-format.txt" http://localhost:3000/api/tasks

# curl-format.txt:
time_total: %{time_total}s
time_connect: %{time_connect}s
```

---

## 🔒 Security Checklist

### Before Production:
- [ ] Change all default secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Update Microsoft redirect URIs
- [ ] Review user permissions
- [ ] Enable database backups
- [ ] Set up monitoring/logging
- [ ] Test all authentication flows

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check DATABASE_URL in .env
# Test connection:
psql $DATABASE_URL
```

### Issue: "Microsoft SSO fails"
**Solution:**
- Verify Client ID, Secret, Tenant ID
- Check redirect URI matches exactly
- Ensure ID tokens enabled in Azure

### Issue: "SharePoint upload fails"
**Solution:**
- Verify Site ID and Drive ID
- Check API permissions in Azure
- Test with Graph Explorer first

### Issue: "Teams webhook not working"
**Solution:**
```bash
# Test webhook manually:
curl -H "Content-Type: application/json" \
  -d '{"text":"Test"}' \
  YOUR_WEBHOOK_URL
```

---

## 📈 Scaling Considerations

### Database
- Add read replicas for reporting
- Implement connection pooling
- Archive old audit logs

### Application
- Use PM2 for process management
- Enable horizontal scaling
- Implement caching (Redis)

### File Storage
- Consider Azure Blob Storage for large files
- Implement CDN for static assets
- Set up backup strategy

---

## ✅ Post-Deployment Checklist

- [ ] All users can login via Microsoft SSO
- [ ] Admin can manage users and roles
- [ ] Tasks can be created and assigned
- [ ] Evidence uploads to SharePoint
- [ ] Task completion workflow works
- [ ] CSV import functions correctly
- [ ] Weekly Teams reports sending
- [ ] Audit logs capturing all actions
- [ ] Dashboard stats displaying correctly
- [ ] All integrations configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

---

**🎉 Your Compliance Management System is Ready for Production!**
