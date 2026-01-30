# Compliance Management System

A production-ready Compliance Management System built as a monorepo that manages statutory and internal compliance tasks with evidence-based task closure, role-based access control, audit trails, and Microsoft ecosystem integration.

## 🚀 Features

### Core Functionality
- **Evidence-Based Task Closure**: All tasks require evidence upload to SharePoint before completion
- **Role-Based Access Control (RBAC)**: Three roles - Admin, Reviewer, and Task Owner with distinct permissions
- **Complete Auditability**: Immutable audit logs for all actions
- **Microsoft SSO Integration**: Secure authentication via Microsoft Entra ID
- **SharePoint Integration**: Auto-create folder structures and manage evidence files
- **Teams Integration**: Automated weekly compliance reports via webhooks
- **CSV Bulk Import**: Import thousands of compliance tasks with preview and validation
- **Multi-tenant**: Workspace-based data isolation

### User Roles

#### Admin
- Full system access
- Manage users and roles
- Configure integrations (SharePoint, Teams)
- CSV import with preview/commit
- Manage master data
- View all audit logs

#### Reviewer
- Create and assign tasks
- Edit task details (not execution fields)
- View all tasks workspace-wide
- View audit logs
- Each task has exactly ONE reviewer

#### Task Owner (End User)
- View ONLY assigned tasks
- Upload evidence to SharePoint
- Complete or skip tasks
- Each task has exactly ONE owner

## 📁 Project Structure

```
kelp/
├── apps/
│   ├── backend-nest/          # NestJS backend API
│   │   ├── prisma/             # Database schema and migrations
│   │   ├── src/                # Source code
│   │   └── .env.example        # Backend environment template
│   └── frontend-angular/       # Angular frontend
│       ├── src/                # Source code
│       └── .env.example        # Frontend environment template
├── packages/
│   └── shared-types/           # Shared TypeScript types
├── docs/
│   └── setup.md                # Detailed setup instructions
└── .kiro/
    └── specs/                  # Requirements and design docs
```

## 🛠️ Technology Stack

### Frontend
- **Angular 21** - Enterprise web framework
- **Angular Material** - UI component library
- **MSAL Angular** - Microsoft authentication
- **RxJS** - Reactive programming
- **TypeScript** - Type-safe development

### Backend
- **NestJS 11** - Enterprise Node.js framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **Passport JWT** - Authentication strategy
- **Microsoft Graph API** - SharePoint/Teams integration
- **NestJS Schedule** - Cron jobs for weekly reports

### Infrastructure
- **PNPM Workspaces** - Monorepo management
- **Supabase** - Managed PostgreSQL hosting
- **TypeScript** - End-to-end type safety

## 🚦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PNPM >= 8.0.0
- PostgreSQL 14+ or Supabase account
- Microsoft Entra ID app registration

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   # Backend
   cp apps/backend-nest/.env.example apps/backend-nest/.env
   # Edit apps/backend-nest/.env with your values
   
   # Frontend
   cp apps/frontend-angular/.env.example apps/frontend-angular/.env
   # Edit apps/frontend-angular/.env with your values
   ```

3. **Setup database**
   ```bash
   # Generate Prisma client
   pnpm --filter backend-nest db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Seed initial data
   pnpm db:seed
   ```

4. **Start development servers**
   ```bash
   # Run both frontend and backend
   pnpm dev
   
   # Or run separately:
   pnpm backend:dev   # http://localhost:3000
   pnpm frontend:dev  # http://localhost:4200
   ```

## 📚 Documentation

- **[Setup Guide](docs/setup.md)** - Detailed setup instructions including:
  - Database configuration
  - Microsoft Entra ID setup
  - SharePoint configuration
  - Teams webhook setup
  - Production deployment

- **[Requirements](..kiro/specs/compliance-management-system/requirements.md)** - Complete functional requirements

- **[Design](..kiro/specs/compliance-management-system/design.md)** - Architecture and design decisions

- **[Tasks](..kiro/specs/compliance-management-system/tasks.md)** - Implementation task list

## 🔑 Key Concepts

### Task Lifecycle

```
PENDING → (Upload Evidence + Add Comment) → COMPLETED
       → (Provide Skip Reason) → SKIPPED
```

### Evidence Management

All evidence files are stored in SharePoint with auto-created folder structure:
```
Compliance-Documents/
└── {Entity}/
    └── {Year}/
        └── {Month}/
            └── {Compliance_ID}/
                ├── file1.pdf
                ├── file2.xlsx
```

### CSV Import

Admins can bulk import tasks via CSV with:
- **Preview mode**: Validate without saving
- **Commit mode**: Save to database
- Auto-creation of missing master data (entities, departments, laws)
- Row-level error tracking
- Downloadable error reports

### Audit Trail

Every action is logged:
- User and timestamp
- Action type and entity affected
- Before/after values
- Request tracing with request ID

## 🔒 Security

- **Microsoft SSO** - OAuth code flow with JWT httpOnly cookies
- **RBAC** - Role-based endpoint protection
- **Encrypted Configs** - Sensitive values encrypted at rest
- **HTTPS Only** - Secure transport in production
- **CSRF Protection** - sameSite cookies
- **SQL Injection Prevention** - Prisma parameterized queries
- **XSS Prevention** - Angular sanitization

## 📊 Database Schema

### Core Tables
- `workspaces` - Multi-tenancy support
- `users` - User accounts with roles
- `entities` - Operating units
- `departments` - Department master data
- `laws` - Law master data
- `compliances_master` - Legal compliance categories
- `compliance_tasks` - Main task table
- `task_execution` - Execution history
- `evidence_files` - SharePoint file metadata
- `audit_logs` - Immutable audit trail
- `csv_import_jobs` - Import job tracking
- `report_runs` - Weekly report execution log
- `configs` - System configuration

## 🎯 Use Cases

### Task Owner Daily Workflow
1. Login with Microsoft account
2. View "My Dashboard" with pending tasks
3. Click on overdue task
4. Upload evidence files (PDF, images, documents)
5. Add completion comment
6. Submit task completion

### Reviewer Weekly Workflow
1. Login and view dashboard with entity/department stats
2. Create new compliance tasks
3. Assign tasks to team members (one owner per task)
4. Review completed tasks and evidence
5. Check audit logs for accountability

### Admin Monthly Workflow
1. Upload CSV with 500+ compliance tasks
2. Preview validation results
3. Fix errors and commit import
4. Configure weekly Teams reports
5. Manage user roles
6. Review system health and audit logs

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev                  # Run both apps
pnpm backend:dev          # Backend only
pnpm frontend:dev         # Frontend only

# Database
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed data
pnpm db:studio            # Open Prisma Studio
pnpm db:generate          # Generate Prisma client

# Build
pnpm build                # Build all apps

# Testing
pnpm test                 # Run tests
```

### Backend Module Structure

```
src/
├── auth/              # Authentication & authorization
├── users/             # User management
├── master-data/       # Master data CRUD
├── tasks/             # Task management
├── evidence/          # SharePoint integration
├── import/            # CSV import
├── audit/             # Audit logging
├── reports/           # Teams reporting
├── integrations/      # SharePoint/Teams config
└── config/            # System configuration
```

## 🌐 Environment Variables

### Backend Required
- `DATABASE_URL` - PostgreSQL connection string
- `MICROSOFT_CLIENT_ID` - Azure AD app client ID
- `MICROSOFT_CLIENT_SECRET` - Azure AD app secret
- `MICROSOFT_TENANT_ID` - Azure AD tenant ID
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - Config encryption key

### Frontend Required
- `MICROSOFT_CLIENT_ID` - Azure AD app client ID (same as backend)
- `MICROSOFT_TENANT_ID` - Azure AD tenant ID
- `BACKEND_API_URL` - Backend API URL

See `.env.example` files for complete list.

## 📈 Scalability

- **5,000+ tasks** supported with pagination and indexing
- **Multi-file uploads** with chunked transfer for large files
- **Bulk import** with preview validation
- **Database indexes** on frequently queried fields
- **Connection pooling** for database efficiency

## 🧪 Testing

```bash
# Backend unit tests
pnpm --filter backend-nest test

# Backend e2e tests
pnpm --filter backend-nest test:e2e

# Frontend tests
pnpm --filter frontend-angular test
```

## 📦 Deployment

See [Setup Guide](docs/setup.md) for production deployment instructions including:
- Environment configuration
- Database migrations
- Build process
- Security checklist
- HTTPS setup
- CORS configuration

## 🤝 Contributing

This is a production system. Follow these guidelines:
- No placeholder code or TODOs
- Full validation and error handling
- TypeScript strict mode
- Comprehensive audit logging
- Transaction support for critical operations

## 📄 License

MIT

## 🙋 Support

For detailed setup instructions, see [docs/setup.md](docs/setup.md)

---

**Built with ❤️ for compliance teams**
