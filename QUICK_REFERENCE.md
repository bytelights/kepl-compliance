# 🚀 Quick Reference Card

## Essential Commands

```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd apps/backend-nest && npx prisma generate

# Database operations
pnpm db:migrate          # Run migrations
pnpm db:seed            # Seed initial data
pnpm db:studio          # Open Prisma Studio

# Development
pnpm dev                # Start both apps
pnpm backend:dev        # Backend only (port 3000)
pnpm frontend:dev       # Frontend only (port 4200)

# Production build
pnpm build              # Build all apps
```

## API Endpoints Quick List

```
# Auth
GET  /api/auth/microsoft/login
GET  /api/auth/me
POST /api/auth/logout

# Users (admin)
GET   /api/users
PATCH /api/users/:id/role

# Master Data (admin CRUD, all can read)
GET/POST/PATCH/DELETE /api/master/entities
GET/POST/PATCH/DELETE /api/master/departments
GET/POST/PATCH/DELETE /api/master/laws
GET/POST/PATCH/DELETE /api/master/compliances

# Tasks
GET    /api/tasks
POST   /api/tasks (admin/reviewer)
PATCH  /api/tasks/:id (admin/reviewer)
DELETE /api/tasks/:id (admin)
POST   /api/tasks/:id/execute/complete (owner)
POST   /api/tasks/:id/execute/skip (owner)

# Evidence
POST /api/tasks/:id/evidence/upload-session
POST /api/tasks/:id/evidence/complete
GET  /api/tasks/:id/evidence
DELETE /api/evidence/:id

# CSV Import (admin)
POST /api/admin/import/csv?mode=preview
POST /api/admin/import/csv?mode=commit
GET  /api/admin/import/jobs
GET  /api/admin/import/jobs/:id

# Audit Logs (admin/reviewer)
GET /api/audit-logs

# Integrations (admin)
GET/PUT  /api/integrations/sharepoint
POST     /api/integrations/sharepoint/test
GET/PUT  /api/integrations/teams
POST     /api/integrations/teams/test
POST     /api/integrations/teams/send-report-now

# Dashboard
GET /api/dashboard/task-owner
GET /api/dashboard/reviewer
GET /api/dashboard/admin
```

## Default Credentials (After Seed)

```
Admin:    admin@example.com
Reviewer: reviewer@example.com
```

⚠️ Update these in `apps/backend-nest/prisma/seed.ts` before production!

## File Locations

```
├── apps/backend-nest/          # Backend API
│   ├── .env                    # Environment config
│   ├── prisma/schema.prisma    # Database schema
│   └── src/                    # Source code
│
├── apps/frontend-angular/      # Frontend app
│   └── src/                    # Source code
│
├── packages/shared-types/      # Shared types
│
└── docs/                       # Documentation
    ├── setup.md
    ├── TESTING_DEPLOYMENT.md
    └── ENVIRONMENT_VARIABLES.md
```

## Role Permissions Matrix

| Feature | Admin | Reviewer | Task Owner |
|---------|-------|----------|------------|
| View all tasks | ✅ | ✅ | ❌ (only assigned) |
| Create tasks | ✅ | ✅ | ❌ |
| Edit tasks | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ❌ | ❌ |
| Complete tasks | ❌ | ❌ | ✅ (assigned only) |
| Upload evidence | ✅ | ✅ | ✅ |
| Delete evidence | ✅ | ❌ | ✅ (if task pending) |
| CSV import | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Master data | ✅ CRUD | View only | View only |
| Audit logs | ✅ | ✅ | ❌ |
| Integrations | ✅ | ❌ | ❌ |

## Troubleshooting Quick Fixes

### Database connection failed
```bash
# Check connection
psql $DATABASE_URL

# Regenerate Prisma client
cd apps/backend-nest
npx prisma generate
```

### Microsoft SSO not working
1. Verify Client ID, Secret, Tenant ID in .env
2. Check redirect URI matches in Azure
3. Ensure ID tokens enabled

### Port already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm backend:dev
```

### Prisma errors
```bash
# Reset database (⚠️ deletes all data)
pnpm db:migrate reset

# Re-run migrations
pnpm db:migrate

# Re-seed
pnpm db:seed
```

## Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] PNPM installed
- [ ] PostgreSQL running (or Supabase account)
- [ ] Microsoft Entra ID app registered
- [ ] SharePoint site accessible
- [ ] .env file configured
- [ ] Dependencies installed
- [ ] Prisma client generated
- [ ] Migrations run
- [ ] Database seeded

## URLs

- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api
- **Prisma Studio**: Run `pnpm db:studio` → http://localhost:5555

## Support Documents

- **README.md** - Project overview
- **COMPLETE.md** - Quick completion summary
- **FINAL_SUMMARY.md** - Complete implementation guide
- **PROGRESS.md** - Detailed checklist
- **docs/setup.md** - Full setup instructions
- **docs/TESTING_DEPLOYMENT.md** - Testing & deployment
- **docs/ENVIRONMENT_VARIABLES.md** - Environment config

## Quick Health Check

```bash
# Backend health
curl http://localhost:3000/api/auth/me

# Database health
pnpm db:studio

# Frontend health
open http://localhost:4200
```

---

**📚 For detailed information, see FINAL_SUMMARY.md**
