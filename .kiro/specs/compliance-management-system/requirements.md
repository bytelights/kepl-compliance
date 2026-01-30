# Compliance Management System - Requirements

## 1. Overview

A production-ready Compliance Management System (CMS) built as a monorepo that manages statutory and internal compliance tasks with evidence-based task closure, role-based access control, audit trails, and Microsoft ecosystem integration.

### Key Objectives
- Centralize compliance tracking across entities and departments
- Evidence-based task closure with SharePoint integration
- Complete auditability and traceability
- Role-based access control (RBAC)
- Automated weekly reporting to Microsoft Teams
- Bulk compliance creation via CSV import
- Auto-create SharePoint folder structures

## 2. Technology Stack

### Frontend
- Angular (latest stable)
- TypeScript
- Angular Material UI
- MSAL for authentication

### Backend
- NestJS (latest stable)
- TypeScript
- Prisma ORM
- NestJS Cron for scheduling

### Database
- PostgreSQL (Supabase)
- SQL migrations

### Integrations
- Microsoft SSO (MSAL) - OAuth code flow with JWT httpOnly cookies
- Microsoft SharePoint via Graph API for file storage
- Microsoft Teams via webhook for reporting

### Monorepo
- PNPM workspaces
- Shared types package (optional)

## 3. User Roles and Permissions

### 3.1 Admin Role
**Capabilities:**
- Full system access
- Manage users and roles
- Manage master data (entities, departments, laws, legal compliances)
- Configure SharePoint and Teams integrations
- Upload/import tasks via CSV with preview, commit, and error handling
- Create, edit, delete, and assign tasks
- View all tasks, dashboards, and audit logs

### 3.2 Reviewer Role
**Capabilities:**
- Create tasks
- Assign tasks to end users (single assignee per task)
- Edit task core fields and manage lifecycle states (except execution fields)
- View all tasks workspace-wide
- View dashboards and audit logs
- Review multiple tasks

**Constraints:**
- Each task has exactly ONE reviewer (reviewer_id is single FK)
- Cannot perform execution actions (complete/skip)

### 3.3 Task Owner (End User) Role
**Capabilities:**
- View ONLY tasks assigned to them
- Upload evidence files to SharePoint for assigned tasks
- Complete or skip tasks (execution actions)
- Access personal "My Dashboard"

**Constraints:**
- Cannot create tasks
- Cannot assign tasks
- Cannot edit core task fields (law/entity/owner/reviewer)
- Each task has exactly ONE owner (owner_id is single FK)

### 3.4 Cardinality Rules
- Each task has exactly ONE assignee (owner_id) - enforced in DB and DTO validation
- Each task has exactly ONE reviewer (reviewer_id) - enforced in DB and DTO validation
- One reviewer can be assigned to many tasks (1:N)
- One owner can be assigned to many tasks (1:N)

## 4. Authentication and Authorization

### 4.1 Microsoft SSO Integration
- Backend implements OAuth code flow
- Secure app session using JWT httpOnly cookies
- Users table is source of truth for roles

### 4.2 Role Resolution on Login
**If user exists in database:**
- Use stored role (admin/reviewer/task_owner)

**If user does not exist:**
- Create user with default role = task_owner

**On each login update:**
- ms_oid (Microsoft Object ID)
- last_login_at timestamp
- name/email (if changed)

### 4.3 Pre-seeded Users
- Admin and Reviewer users are PRE-SEEDED in DB by email before first login
- Admin can promote/demote roles from Admin UI

### 4.4 Authentication Endpoints
- `GET /auth/microsoft/login` - Initiate OAuth flow
- `GET /auth/microsoft/callback` - OAuth callback handler
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout and clear session

### 4.5 User Management Endpoints (Admin Only)
- `GET /users` - List all users
- `PATCH /users/:id/role` - Update user role
  - Body: `{ role: 'admin' | 'reviewer' | 'task_owner' }`

### 4.6 User Dropdown Rules
- Assignee dropdown shows only users existing in DB (signed-in or pre-seeded)
- Same rule applies for reviewer dropdown

## 5. Master Data Management

### 5.1 Master Data Types
Admin maintains dropdown lists used in tasks:
- **Entities** (Operating Units)
- **Departments**
- **Laws**
- **Legal Compliances** (compliances_master table)

### 5.2 Master Data Tables
```
entities(id, workspace_id, name unique per workspace, created_at)
departments(id, workspace_id, name unique per workspace, created_at)
laws(id, workspace_id, name unique per workspace, created_at)
compliances_master(id, workspace_id, name unique per workspace, created_at)
```

### 5.3 Master Data APIs
For each master data type (entities, departments, laws, compliances_master):
- `GET /master/{type}` - List all (all roles)
- `POST /master/{type}` - Create (admin only)
- `PATCH /master/{type}/:id` - Update (admin only)
- `DELETE /master/{type}/:id` - Delete (admin only)

### 5.4 Access Control
- Admin: full CRUD access
- Reviewer/Task Owner: read-only access

### 5.5 CSV Import Auto-creation
CSV import should auto-create missing:
- Entities
- Departments
- Laws
- Compliances_master (if mapped)

## 6. CSV Bulk Import

### 6.1 CSV Format
**Required columns (exact names):**
```
Compliance Id, Title, Name of Law, Department, Operating Unit, Owner, Reviewer, Current Due Date, Frequency, Status, Impact
```

### 6.2 Validation Rules
- Required fields must be present
- Department auto-created if not found
- Entity auto-created if not found (Operating Unit → Entity)
- Law auto-created if not found
- Owner MUST exist as user (match by email preferred; allow exact name fallback)
- Reviewer MUST exist as user (match by email preferred; allow exact name fallback)

### 6.3 Duplicate Detection
**Unique constraint:** `unique(workspace_id, compliance_id, entity_id)`
- Duplicates rejected with row-level errors
- Upload errors logged and downloadable

### 6.4 CSV Import Endpoints
- `POST /admin/import/csv?mode=preview|commit` - Upload CSV
  - Preview mode: validate without saving
  - Commit mode: save to database
- `GET /admin/import/jobs` - List import jobs
- `GET /admin/import/jobs/:id` - Get job details
- `GET /admin/import/jobs/:id/errors` - Download errors (JSON/CSV)

### 6.5 CSV Import Storage
Tables:
- `csv_import_jobs` - Job metadata
- `csv_import_job_rows` - Individual row results and errors

## 7. Compliance Task Lifecycle

### 7.1 Task Status Enum
Stored status values:
- `PENDING` - Task not yet completed
- `COMPLETED` - Task completed with evidence
- `SKIPPED` - Task skipped with reason

### 7.2 Overdue Calculation
Derived field:
- `due_date < today AND status = PENDING`

### 7.3 Task Completion Rules
To mark task as COMPLETED, task owner must:
1. Provide a COMMENT (mandatory)
2. Upload at least ONE EVIDENCE file (mandatory)
3. Submit completion

### 7.4 Task Skip Rules
To mark task as SKIPPED, task owner must:
1. Provide SKIP REASON (mandatory)
2. Evidence is optional

### 7.5 Frontend Execution Modal Requirements
When task_owner clicks "Complete Task":
- Open modal requiring:
  - Comment field (required)
  - File upload dropzone (required, multiple files allowed)
  - "Submit" button enabled only when:
    - At least 1 file uploaded successfully
    - Comment field filled

### 7.6 Backend Execution Flow
**Complete Task Transaction:**
1. Ensure evidence exists (>=1 completed evidence_files)
2. Create task_execution row with comment/remarks
3. Update task.status to COMPLETED
4. Write audit log

**Skip Task Transaction:**
1. Create task_execution row with remarks
2. Update task.status to SKIPPED
3. Write audit log

### 7.7 Task Execution Endpoints
- `POST /tasks/:id/execute/complete` - Complete task (task_owner only)
  - Requires: comment + evidence existence
- `POST /tasks/:id/execute/skip` - Skip task (task_owner only)
  - Requires: remarks

## 8. SharePoint Evidence Management

### 8.1 Folder Structure
Auto-create folder hierarchy:
```
Compliance-Documents/
└── {Entity}/
    └── {Year}/
        └── {Month}/
            └── {Compliance_ID}/
                ├── file1.ext
                ├── file2.ext
```

### 8.2 Upload Requirements
- Multi-file drag & drop upload
- Progress indicator per file
- Retry capability
- Chunk upload via createUploadSession
- Client uploads chunks directly to Graph uploadUrl

### 8.3 Backend Upload Flow
1. Ensure folder path exists (auto-create folders)
2. Create upload session in correct folder
3. Complete upload and store metadata in DB
4. Idempotency: avoid duplicate evidence entries for same item_id & task

### 8.4 Evidence Endpoints
- `POST /tasks/:id/evidence/upload-session` - Create upload session
  - Body: `{ fileName, fileSize, mimeType }`
  - Returns: `{ uploadSessionId, uploadUrl, expiresAt, chunkSizeBytes, siteId, driveId, targetPath }`
- `POST /tasks/:id/evidence/complete` - Complete upload
  - Body: `{ uploadSessionId, itemId, webUrl, name, sizeBytes, mimeType, siteId, driveId, path }`
  - Action: create evidence_files row, audit log
- `GET /tasks/:id/evidence` - List task evidence
- `DELETE /evidence/:id` - Delete evidence
  - Admin: can delete any
  - Owner: can delete only if task PENDING and evidence belongs to them

### 8.5 SharePoint Configuration
Stored in configs table:
- tenant_id
- site_id
- drive_id
- base_folder_name ("Compliance-Documents")

### 8.6 SharePoint Integration Endpoints
- `PUT /integrations/sharepoint` - Update config (admin only)
- `POST /integrations/sharepoint/test` - Test connection (admin only)

## 9. Teams Weekly Report

### 9.1 Report Content
Weekly consolidated report includes:
- Summary counts:
  - Pending tasks
  - Due next 7 days
  - Overdue tasks
- Table rows: Compliance ID | Title | Entity | Due Date | Status | Impact | Owner | Reviewer

### 9.2 Delivery Method
- Teams webhook (Workflows + Adaptive Card)
- Configurable schedule in DB (configs)
- Deduplication per period
- Store execution in report_runs table

### 9.3 Teams Integration Endpoints
- `PUT /integrations/teams` - Update webhook config (admin only)
- `POST /integrations/teams/test` - Test webhook post (admin only)

### 9.4 Scheduler Configuration
Stored in configs:
- teams_webhook_url
- weekly_report_day_of_week
- weekly_report_time_hhmm
- timezone

## 10. Dashboards

### 10.1 Task Owner Dashboard ("My Dashboard")
- My pending count
- Due this week count
- Overdue count
- Calendar view of tasks
- Quick actions:
  - Upload evidence
  - Complete task
  - Skip task

### 10.2 Reviewer Dashboard
- Entity-wise compliance health
- Department-wise statistics
- Overdue list
- Audit logs viewer

### 10.3 Admin Dashboard
- Import history + errors
- Compliance health overview
- User activity
- Audit logs
- Master data management
- Integrations management

## 11. Filters, Search, and Pagination

### 11.1 Available Filters
- Entity
- Department
- Law
- Status
- Date range
- Owner
- Reviewer
- Compliance ID
- Impact
- Frequency

### 11.2 Search Functionality
Search matches:
- Title
- Compliance ID
- Entity name
- Law name

### 11.3 Pagination
- Support for 5,000+ tasks
- Configurable page size

### 11.4 List RBAC
- Admin/Reviewer: view all tasks
- Task Owner: view only assigned tasks

## 12. Audit Logs

### 12.1 Logged Actions
Log every action:
- Role changes
- Master data create/update/delete
- CSV import preview/commit + row failures
- Task create/edit/assign/status changes
- Evidence uploads completed
- Task execution complete/skip
- Config/integration changes

### 12.2 Audit Log Properties
- Immutable (no update/delete endpoints)
- Viewable only by admin + reviewer
- Include:
  - Timestamp
  - User ID
  - Action type
  - Entity type
  - Entity ID
  - Changes (before/after)
  - Request ID

## 13. Database Schema

### 13.1 Core Tables
- `workspaces` - Multi-tenancy support
- `users` - User accounts with roles
  - role enum: admin/reviewer/task_owner
  - last_login_at
  - is_active
  - ms_oid
- `entities` - Operating units
- `departments` - Department master data
- `laws` - Law master data
- `compliances_master` - Legal compliance categories
- `compliance_tasks` - Main task table
- `task_execution` - Execution history
- `evidence_files` - SharePoint file metadata
- `audit_logs` - Immutable audit trail
- `csv_import_jobs` - Import job tracking
- `csv_import_job_rows` - Import row details
- `report_runs` - Weekly report execution log
- `configs` - System configuration

### 13.2 Compliance Tasks Constraints
- `owner_id` (single) FK to users
- `reviewer_id` (single) FK to users
- `unique(workspace_id, compliance_id, entity_id)`

### 13.3 Workspace Awareness
All tables include workspace_id for multi-tenancy support

## 14. Backend Architecture

### 14.1 NestJS Modules
- `AuthModule` - Authentication and authorization
- `UsersModule` - User management
- `MasterDataModule` - Master data CRUD
- `TasksModule` - Task management
- `EvidenceModule` - SharePoint integration
- `ImportModule` - CSV import
- `AuditModule` - Audit logging
- `ReportsModule` - Weekly Teams reports
- `IntegrationsModule` - SharePoint/Teams config
- `ConfigModule` - System configuration

### 14.2 Backend Features
- DTO validation with class-validator
- Global exception filter
- Structured logging with request ID
- Consistent API response format
- Cookie security (httpOnly, secure, sameSite)
- RBAC guards and policies
- Transaction support for critical operations

## 15. Frontend Architecture

### 15.1 Login Flow
- Microsoft sign-in via backend redirect
- Handle OAuth callback
- Store session cookie

### 15.2 Task Owner Pages
- My Dashboard
- My Tasks list
- Task detail view
- Complete Task modal (comment + required evidence upload)
- Skip Task modal (reason required)

### 15.3 Reviewer Pages
- Dashboard with analytics
- All tasks list (read-only for execution)
- Task create/edit/assign forms
- Audit logs viewer

### 15.4 Admin Pages
- Dashboard with system overview
- Tasks management (create/edit/assign)
- CSV import (preview/commit/errors)
- Users & roles management
- Master data management:
  - Entities
  - Departments
  - Laws
  - Legal compliances
- Integrations:
  - SharePoint config + test
  - Teams webhook + schedule + test
- Audit logs viewer

## 16. Configuration Management

### 16.1 Configs Table Schema
```
configs:
- id: uuid (PK)
- workspace_id: uuid
- key_name: text
- value: text (encrypted for sensitive values)
- active: boolean
- created_at: timestamp
- updated_at: timestamp
```

### 16.2 Configuration Keys
- teams_webhook_url
- weekly_report_day_of_week
- weekly_report_time_hhmm
- timezone
- sharepoint_tenant_id
- sharepoint_site_id
- sharepoint_drive_id
- sharepoint_base_folder_name

### 16.3 Security
- Encrypt sensitive values before storing
- Admin-only access via integration screens

## 17. Acceptance Criteria

### AC1: Authentication and Authorization
- Microsoft SSO authentication works end-to-end
- Pre-seeded admin/reviewer users get correct roles on first login
- New sign-ins default to task_owner role
- Admin can change user roles via Admin UI
- Role-based access control enforced on all endpoints
- Session management with httpOnly JWT cookies

### AC2: Task Assignment and Reviewer Workflow
- Reviewer can create new tasks
- Reviewer can edit task core fields
- Reviewer can assign tasks to single owner
- Each task has exactly one owner (enforced in DB and validation)
- Each task has exactly one reviewer (enforced in DB and validation)
- Reviewer can handle multiple tasks
- Reviewer can view all tasks workspace-wide

### AC3: Task Owner Execution Workflow
- Task owner can only see tasks assigned to them
- Task completion requires modal with:
  - Comment field (mandatory)
  - At least 1 uploaded evidence file (mandatory)
  - Submit button disabled until requirements met
- Task skip requires mandatory reason
- Evidence optional for skip
- Task status updates correctly (PENDING → COMPLETED/SKIPPED)

### AC4: SharePoint Evidence Management
- Evidence uploads to SharePoint via Graph API
- Folder structure auto-created: Compliance-Documents/{Entity}/{Year}/{Month}/{Compliance_ID}/
- Multi-file upload with progress indicators
- Chunk upload for large files
- Metadata stored in evidence_files table
- Idempotency prevents duplicate uploads
- Admin can delete any evidence
- Owner can delete evidence only if task PENDING and evidence belongs to them

### AC5: CSV Bulk Import
- Admin can upload CSV with preview mode
- Preview validates without saving
- Commit mode saves to database
- Auto-creates missing entities, departments, laws
- Owner and reviewer must exist (matched by email/name)
- Duplicate detection: unique(workspace_id, compliance_id, entity_id)
- Row-level errors captured and downloadable
- Import jobs and errors tracked in database

### AC6: Teams Weekly Report
- Weekly report posts automatically via Teams webhook
- Report includes summary counts and task table
- Adaptive Card format
- Configurable schedule (day of week, time, timezone)
- Deduplication per period
- Report execution stored in report_runs table
- Test post functionality works
- Admin can configure webhook URL and schedule

### AC7: Audit Logging
- All major actions logged to audit_logs table
- Logged actions include:
  - Role changes
  - Master data changes
  - CSV imports
  - Task lifecycle changes
  - Evidence uploads
  - Task execution
  - Configuration changes
- Audit logs are immutable (no update/delete)
- Viewable by admin and reviewer only
- Include timestamp, user, action, entity, changes

### AC8: Performance and Scalability
- Filters and search work efficiently
- Pagination supports 5,000+ tasks
- Database queries optimized with indexes
- List permissions enforced (admin/reviewer see all, owner sees assigned only)
- Search matches title, compliance_id, entity, law

### AC9: Master Data Management
- Admin can CRUD entities, departments, laws, compliances_master
- Master data unique per workspace
- Reviewer and task_owner have read-only access
- Master data used in task dropdowns
- Validation prevents deletion of in-use master data

### AC10: System Configuration
- Configs stored in database with encryption for sensitive values
- Admin can configure SharePoint integration
- Admin can configure Teams webhook
- Admin can test integrations
- Configuration changes logged in audit_logs

## 18. Deliverables

### 18.1 Monorepo Structure
```
/
├── apps/
│   ├── frontend-angular/
│   └── backend-nest/
├── packages/
│   └── shared-types/
├── docs/
│   └── setup.md
├── migrations/
│   └── 001_init.sql
├── scripts/
│   └── import-csv.ts
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

### 18.2 Documentation
- setup.md with instructions for:
  - Supabase setup
  - Microsoft Entra ID app registration
  - SharePoint configuration
  - Teams webhook setup
  - Environment variables
  - Local development
- .env.example files at root and app levels

### 18.3 Scripts
- `pnpm dev` - Run frontend and backend concurrently
- `import-csv.ts` - CLI tool for bulk compliance creation

### 18.4 Code Quality
- No placeholder code or "TODO later" comments
- Full validation and error handling
- TypeScript strict mode
- Consistent code formatting
- Comprehensive DTO validation
- Transaction support for critical operations
- Idempotency where required

## 19. Non-Functional Requirements

### 19.1 Security
- HTTPS only
- httpOnly, secure, sameSite cookies
- CSRF protection
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (Angular sanitization)
- Encrypted sensitive configuration values
- RBAC enforced at API and UI levels

### 19.2 Performance
- Database indexes on frequently queried fields
- Pagination for large datasets
- Efficient filtering and search
- Chunk upload for large files
- Connection pooling

### 19.3 Reliability
- Transaction support for critical operations
- Idempotency for uploads and imports
- Error handling and logging
- Retry mechanisms for external API calls
- Graceful degradation

### 19.4 Maintainability
- Modular architecture
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive error messages
- Structured logging
- Type safety with TypeScript

### 19.5 Usability
- Intuitive UI with Angular Material
- Clear error messages
- Progress indicators for long operations
- Responsive design
- Accessible components
