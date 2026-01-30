# Database Schema Diagram

**ByteLights Private Limited**

---

# Compliance Management System
## Database Architecture and Entity Relationship Diagram

**Document Version:** 1.0  
**Date:** January 24, 2026  
**Database:** PostgreSQL  
**ORM:** Prisma

---

## Schema Overview

The database consists of **14 tables** organized into 5 functional groups:

1. **Core Tables** - Workspace, User
2. **Master Data** - Entity, Department, Law, ComplianceMaster
3. **Compliance Tasks** - ComplianceTask, TaskExecution
4. **Evidence Management** - EvidenceFile
5. **System Tables** - CsvImportJob, CsvImportJobRow, AuditLog, ReportRun, Config

---

## Entity Relationship Diagram

### Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WORKSPACE                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PK: id (UUID)                                            │  │
│  │ name (String)                                            │  │
│  │ created_at, updated_at                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐            │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│    ┌─────────┐         ┌──────────┐        ┌──────────┐       │
│    │ USERS   │         │ ENTITIES │        │  LAWS    │       │
│    └─────────┘         └──────────┘        └──────────┘       │
│         │                    │                    │             │
│         │              ┌─────┴─────┐             │             │
│         │              ▼           ▼             │             │
│         │      ┌──────────┐  ┌──────────┐       │             │
│         │      │  DEPTS   │  │ MASTER   │       │             │
│         │      └──────────┘  │ DATA     │       │             │
│         │              │     └──────────┘       │             │
│         │              │           │            │             │
│         │              └─────┬─────┴────────────┘             │
│         │                    ▼                                 │
│         │          ┌──────────────────┐                       │
│         └─────────►│ COMPLIANCE TASKS │◄──────────────────┐  │
│                    └──────────────────┘                    │  │
│                         │        │                         │  │
│                  ┌──────┘        └──────┐                 │  │
│                  ▼                      ▼                  │  │
│           ┌──────────┐          ┌──────────┐             │  │
│           │ EVIDENCE │          │   TASK   │             │  │
│           │  FILES   │          │ EXECUTION│             │  │
│           └──────────┘          └──────────┘             │  │
│                                                            │  │
│      ┌────────────┬───────────────┬──────────────┬───────┘  │
│      ▼            ▼               ▼              ▼           │
│  ┌────────┐  ┌──────┐      ┌──────────┐   ┌──────────┐    │
│  │ AUDIT  │  │ CSV  │      │  REPORT  │   │  CONFIG  │    │
│  │  LOG   │  │IMPORT│      │   RUNS   │   │          │    │
│  └────────┘  └──────┘      └──────────┘   └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Table Specifications

### 1. WORKSPACE

**Purpose:** Multi-tenancy support - isolates data for different organizations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique workspace identifier |
| name | VARCHAR | NOT NULL | Workspace/organization name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Relationships:**
- HAS MANY: Users, Entities, Departments, Laws, ComplianceMaster, ComplianceTasks, EvidenceFiles, AuditLogs, CsvImportJobs, ReportRuns, Configs

**Business Rules:**
- All data is workspace-isolated
- Cascade delete removes all related data
- Each organization gets one workspace

---

### 2. USER

**Purpose:** User authentication, authorization, and profile management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique user identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| email | VARCHAR | NOT NULL | User email address |
| name | VARCHAR | NOT NULL | User full name |
| role | ENUM | NOT NULL, DEFAULT 'task_owner' | User role (admin, reviewer, task_owner) |
| ms_oid | VARCHAR | NULLABLE | Microsoft Object ID |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active status |
| last_login_at | TIMESTAMP | NULLABLE | Last login timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, email) - One email per workspace

**Indexes:**
- workspace_id, email
- workspace_id, role

**Relationships:**
- BELONGS TO: Workspace
- HAS MANY: OwnedTasks (as owner), ReviewedTasks (as reviewer), AuditLogs, CsvImportJobs

**Enum Values:**
- `admin` - Full system access
- `reviewer` - Review and oversight
- `task_owner` - Task execution

---

### 3. ENTITY

**Purpose:** Legal entities subject to compliance requirements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique entity identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| name | VARCHAR | NOT NULL | Entity name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, name) - Unique names per workspace

**Indexes:**
- workspace_id

**Relationships:**
- BELONGS TO: Workspace
- HAS MANY: ComplianceTasks

**Business Rules:**
- Cannot delete if referenced by tasks (ON DELETE RESTRICT)

---

### 4. DEPARTMENT

**Purpose:** Organizational units within entities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique department identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| name | VARCHAR | NOT NULL | Department name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, name) - Unique names per workspace

**Indexes:**
- workspace_id

**Relationships:**
- BELONGS TO: Workspace
- HAS MANY: ComplianceTasks

**Business Rules:**
- Cannot delete if referenced by tasks (ON DELETE RESTRICT)

---

### 5. LAW

**Purpose:** Regulatory requirements and compliance laws

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique law identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| name | VARCHAR | NOT NULL | Law/regulation name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, name) - Unique names per workspace

**Indexes:**
- workspace_id

**Relationships:**
- BELONGS TO: Workspace
- HAS MANY: ComplianceTasks

**Business Rules:**
- Cannot delete if referenced by tasks (ON DELETE RESTRICT)

---

### 6. COMPLIANCE_MASTER

**Purpose:** Master compliance task templates/definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique master record identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| name | VARCHAR | NOT NULL | Master task name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, name) - Unique names per workspace

**Indexes:**
- workspace_id

**Relationships:**
- BELONGS TO: Workspace
- HAS MANY: ComplianceTasks

**Business Rules:**
- Optional reference from tasks
- Delete sets task.compliance_master_id to NULL (ON DELETE SET NULL)

---

### 7. COMPLIANCE_TASK

**Purpose:** Individual compliance task instances assigned to users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique task identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| compliance_id | VARCHAR | NOT NULL | Business identifier from CSV |
| title | VARCHAR | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description |
| law_id | UUID | FK → Law, NOT NULL | Associated law |
| department_id | UUID | FK → Department, NOT NULL | Associated department |
| entity_id | UUID | FK → Entity, NOT NULL | Associated entity |
| compliance_master_id | UUID | FK → ComplianceMaster, NULLABLE | Master task reference |
| owner_id | UUID | FK → User, NOT NULL | Task owner |
| reviewer_id | UUID | FK → User, NOT NULL | Task reviewer |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | Task status |
| frequency | ENUM | NULLABLE | Task frequency |
| impact | ENUM | NULLABLE | Impact level |
| due_date | TIMESTAMP | NULLABLE | Task due date |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, compliance_id, entity_id) - Unique task per entity

**Indexes:**
- workspace_id, status
- workspace_id, owner_id
- workspace_id, reviewer_id
- workspace_id, entity_id
- workspace_id, due_date

**Relationships:**
- BELONGS TO: Workspace, Law, Department, Entity, ComplianceMaster (optional), Owner (User), Reviewer (User)
- HAS MANY: TaskExecutions, EvidenceFiles

**Enum Values:**

**TaskStatus:**
- `PENDING` - Task not yet completed
- `COMPLETED` - Task completed with evidence
- `SKIPPED` - Task skipped with remarks

**TaskFrequency:**
- `DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `YEARLY`, `ONE_TIME`

**TaskImpact:**
- `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Business Rules:**
- Cannot delete master data if referenced (ON DELETE RESTRICT)
- Owner and reviewer must exist
- Workspace cascade delete removes all tasks

---

### 8. TASK_EXECUTION

**Purpose:** Track task completion/skip actions with comments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique execution identifier |
| task_id | UUID | FK → ComplianceTask, NOT NULL | Associated task |
| user_id | UUID | NOT NULL | User who executed action |
| action | VARCHAR | NOT NULL | Action type ('COMPLETE' or 'SKIP') |
| comment | TEXT | NULLABLE | Completion comment |
| remarks | TEXT | NULLABLE | Skip reason |
| executed_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Execution timestamp |

**Indexes:**
- task_id

**Relationships:**
- BELONGS TO: ComplianceTask

**Business Rules:**
- Cascade delete when task is deleted
- Maintains history of task actions

---

### 9. EVIDENCE_FILE

**Purpose:** Metadata for files uploaded to SharePoint

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique evidence identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| task_id | UUID | FK → ComplianceTask, NOT NULL | Associated task |
| uploaded_by | UUID | NOT NULL | User who uploaded |
| item_id | VARCHAR | NOT NULL | SharePoint item ID |
| web_url | VARCHAR | NOT NULL | Direct SharePoint URL |
| name | VARCHAR | NOT NULL | File name |
| size_bytes | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR | NOT NULL | File MIME type |
| site_id | VARCHAR | NOT NULL | SharePoint site ID |
| drive_id | VARCHAR | NOT NULL | SharePoint drive ID |
| path | VARCHAR | NOT NULL | Full path in SharePoint |
| uploaded_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |

**Unique Constraints:**
- (task_id, item_id) - Prevent duplicate uploads

**Indexes:**
- workspace_id, task_id

**Relationships:**
- BELONGS TO: Workspace, ComplianceTask

**Business Rules:**
- Cascade delete when task is deleted
- Actual file stored in SharePoint
- This table stores metadata only

---

### 10. CSV_IMPORT_JOB

**Purpose:** Track CSV bulk import operations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique job identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| uploaded_by | UUID | FK → User, NOT NULL | User who initiated import |
| file_name | VARCHAR | NOT NULL | Original CSV filename |
| total_rows | INTEGER | NOT NULL | Total rows in CSV |
| success_rows | INTEGER | NOT NULL, DEFAULT 0 | Successfully imported rows |
| failed_rows | INTEGER | NOT NULL, DEFAULT 0 | Failed rows |
| status | ENUM | NOT NULL, DEFAULT 'PREVIEW' | Import status |
| mode | VARCHAR | NOT NULL | 'preview' or 'commit' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| completed_at | TIMESTAMP | NULLABLE | Completion timestamp |

**Indexes:**
- workspace_id
- workspace_id, created_at

**Relationships:**
- BELONGS TO: Workspace, User (uploader)
- HAS MANY: CsvImportJobRows

**Enum Values (ImportStatus):**
- `PREVIEW` - Validation only
- `IN_PROGRESS` - Currently importing
- `COMPLETED` - Import finished
- `FAILED` - Import failed

**Business Rules:**
- Preview mode validates without saving
- Commit mode saves to database
- Row-level error tracking

---

### 11. CSV_IMPORT_JOB_ROW

**Purpose:** Row-level tracking for CSV imports

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique row identifier |
| job_id | UUID | FK → CsvImportJob, NOT NULL | Parent job |
| row_number | INTEGER | NOT NULL | CSV row number |
| success | BOOLEAN | NOT NULL, DEFAULT FALSE | Import success status |
| error_msg | TEXT | NULLABLE | Error message if failed |
| row_data | JSON | NOT NULL | Original CSV row data |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- job_id
- job_id, success

**Relationships:**
- BELONGS TO: CsvImportJob

**Business Rules:**
- Cascade delete when job is deleted
- Stores original row for debugging

---

### 12. AUDIT_LOG

**Purpose:** Comprehensive activity tracking and audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique log identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| user_id | UUID | FK → User, NOT NULL | User who performed action |
| action | VARCHAR | NOT NULL | Action type |
| entity_type | VARCHAR | NOT NULL | Entity affected |
| entity_id | UUID | NULLABLE | ID of affected entity |
| changes | JSON | NULLABLE | Before/after values |
| request_id | VARCHAR | NULLABLE | Request tracing ID |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes:**
- workspace_id, timestamp
- workspace_id, user_id
- workspace_id, entity_type, entity_id

**Relationships:**
- BELONGS TO: Workspace, User

**Action Types:**
- `ROLE_CHANGED`, `TASK_CREATED`, `TASK_UPDATED`, `TASK_COMPLETED`, `TASK_SKIPPED`
- `EVIDENCE_UPLOADED`, `CSV_IMPORT_STARTED`, `CSV_IMPORT_COMPLETED`
- `MASTER_DATA_CREATED`, `MASTER_DATA_DELETED`

**Business Rules:**
- Immutable after creation
- Infinite retention
- Cannot delete user if has audit logs (ON DELETE RESTRICT)

---

### 13. REPORT_RUN

**Purpose:** Track automated report execution history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique run identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| report_type | VARCHAR | NOT NULL | Report type identifier |
| executed_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Execution timestamp |
| success | BOOLEAN | NOT NULL, DEFAULT TRUE | Execution success status |
| error_msg | TEXT | NULLABLE | Error message if failed |
| period_start | TIMESTAMP | NOT NULL | Report period start |
| period_end | TIMESTAMP | NOT NULL | Report period end |

**Indexes:**
- workspace_id, report_type, period_start

**Relationships:**
- BELONGS TO: Workspace

**Report Types:**
- `WEEKLY_TEAMS` - Weekly compliance report to Teams

**Business Rules:**
- Prevents duplicate reports for same period
- Logs both successful and failed runs

---

### 14. CONFIG

**Purpose:** Store application configuration values with encryption support

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique config identifier |
| workspace_id | UUID | FK → Workspace, NOT NULL | Workspace assignment |
| key_name | VARCHAR | NOT NULL | Configuration key |
| value | TEXT | NOT NULL | Configuration value (encrypted for sensitive) |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Configuration active status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Unique Constraints:**
- (workspace_id, key_name) - One value per key per workspace

**Indexes:**
- workspace_id, key_name

**Relationships:**
- BELONGS TO: Workspace

**Configuration Keys:**
- `sharepoint_tenant_id` - SharePoint tenant
- `sharepoint_site_id` - SharePoint site
- `sharepoint_drive_id` - SharePoint drive
- `sharepoint_client_id` - SharePoint client ID
- `sharepoint_client_secret` - SharePoint secret (encrypted)
- `teams_webhook_url` - Teams webhook (encrypted)

**Business Rules:**
- AES-256-CBC encryption for sensitive values
- Active flag allows soft disable

---

## Relationship Details

### Core Relationships

```
WORKSPACE (1) ──< (M) USER
WORKSPACE (1) ──< (M) ENTITY
WORKSPACE (1) ──< (M) DEPARTMENT
WORKSPACE (1) ──< (M) LAW
WORKSPACE (1) ──< (M) COMPLIANCE_MASTER
WORKSPACE (1) ──< (M) COMPLIANCE_TASK
```

### Task Relationships

```
ENTITY (1) ──< (M) COMPLIANCE_TASK
DEPARTMENT (1) ──< (M) COMPLIANCE_TASK
LAW (1) ──< (M) COMPLIANCE_TASK
COMPLIANCE_MASTER (1) ──< (M) COMPLIANCE_TASK [optional]
USER (owner) (1) ──< (M) COMPLIANCE_TASK
USER (reviewer) (1) ──< (M) COMPLIANCE_TASK
```

### Task Dependencies

```
COMPLIANCE_TASK (1) ──< (M) TASK_EXECUTION
COMPLIANCE_TASK (1) ──< (M) EVIDENCE_FILE
```

### System Relationships

```
WORKSPACE (1) ──< (M) CSV_IMPORT_JOB
USER (1) ──< (M) CSV_IMPORT_JOB
CSV_IMPORT_JOB (1) ──< (M) CSV_IMPORT_JOB_ROW

WORKSPACE (1) ──< (M) AUDIT_LOG
USER (1) ──< (M) AUDIT_LOG

WORKSPACE (1) ──< (M) REPORT_RUN
WORKSPACE (1) ──< (M) CONFIG
```

---

## Data Flow Diagrams

### 1. Task Creation Flow

```
┌──────────────┐
│ Master Data  │
│ (Entity,     │
│  Dept, Law)  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐      ┌──────────────┐
│ CSV Import       │ ────>│ COMPLIANCE   │
│ - Parse CSV      │      │ TASK         │
│ - Validate       │      │              │
│ - Auto-create    │      │ Status:      │
│   master data    │      │ PENDING      │
└──────────────────┘      └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ EVIDENCE     │
                          │ FILE         │
                          │ (SharePoint) │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ TASK         │
                          │ EXECUTION    │
                          │ (Complete/   │
                          │  Skip)       │
                          └──────────────┘
```

### 2. Authentication Flow

```
┌──────────────┐
│ Microsoft    │
│ OAuth Login  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ USER             │
│ - Find by email  │
│ - Auto-create    │
│   if not exists  │
│ - Update login   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AUDIT_LOG        │
│ - Log login      │
│ - Track activity │
└──────────────────┘
```

### 3. Weekly Report Flow

```
┌──────────────┐
│ Cron Job     │
│ (Weekly)     │
└──────┬───────┘
       │
       ▼
┌──────────────────┐      ┌──────────────┐
│ COMPLIANCE_TASK  │ ────>│ Generate     │
│ - Query stats    │      │ Adaptive     │
│ - Get overdue    │      │ Card         │
│ - Get due soon   │      └──────┬───────┘
└──────────────────┘             │
       │                         ▼
       │                  ┌──────────────┐
       │                  │ Teams        │
       │                  │ Webhook      │
       │                  │ (CONFIG)     │
       │                  └──────┬───────┘
       │                         │
       ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ REPORT_RUN   │         │ Send to      │
│ - Log run    │         │ Teams        │
│ - Track      │         │ Channel      │
│   success    │         └──────────────┘
└──────────────┘
```

---

## Database Constraints Summary

### Primary Keys
All tables use **UUID** as primary keys for:
- Global uniqueness
- Security (non-sequential)
- Distributed system support

### Foreign Key Constraints

| Child Table | Parent Table | On Delete Behavior |
|-------------|--------------|-------------------|
| User | Workspace | CASCADE |
| Entity | Workspace | CASCADE |
| Department | Workspace | CASCADE |
| Law | Workspace | CASCADE |
| ComplianceMaster | Workspace | CASCADE |
| ComplianceTask | Workspace | CASCADE |
| ComplianceTask | Entity | RESTRICT |
| ComplianceTask | Department | RESTRICT |
| ComplianceTask | Law | RESTRICT |
| ComplianceTask | ComplianceMaster | SET NULL |
| ComplianceTask | User (owner) | RESTRICT |
| ComplianceTask | User (reviewer) | RESTRICT |
| TaskExecution | ComplianceTask | CASCADE |
| EvidenceFile | Workspace | CASCADE |
| EvidenceFile | ComplianceTask | CASCADE |
| CsvImportJob | Workspace | CASCADE |
| CsvImportJob | User | RESTRICT |
| CsvImportJobRow | CsvImportJob | CASCADE |
| AuditLog | Workspace | CASCADE |
| AuditLog | User | RESTRICT |
| ReportRun | Workspace | CASCADE |
| Config | Workspace | CASCADE |

**Cascade Strategy:**
- **CASCADE:** Delete child records when parent is deleted (workspace isolation)
- **RESTRICT:** Prevent deletion if referenced (data integrity)
- **SET NULL:** Remove reference but keep child record

### Unique Constraints

| Table | Constraint | Purpose |
|-------|-----------|---------|
| User | (workspace_id, email) | One email per workspace |
| Entity | (workspace_id, name) | Unique entity names |
| Department | (workspace_id, name) | Unique department names |
| Law | (workspace_id, name) | Unique law names |
| ComplianceMaster | (workspace_id, name) | Unique master names |
| ComplianceTask | (workspace_id, compliance_id, entity_id) | Unique task per entity |
| EvidenceFile | (task_id, item_id) | Prevent duplicate files |
| Config | (workspace_id, key_name) | One value per key |

---

## Index Strategy

### Performance Indexes

**Purpose:** Optimize common query patterns

| Table | Index | Query Pattern |
|-------|-------|---------------|
| User | (workspace_id, email) | Login lookups |
| User | (workspace_id, role) | Role-based queries |
| ComplianceTask | (workspace_id, status) | Status filtering |
| ComplianceTask | (workspace_id, owner_id) | My tasks query |
| ComplianceTask | (workspace_id, reviewer_id) | Reviewer dashboard |
| ComplianceTask | (workspace_id, entity_id) | Entity filtering |
| ComplianceTask | (workspace_id, due_date) | Overdue calculation |
| EvidenceFile | (workspace_id, task_id) | Task evidence lookup |
| AuditLog | (workspace_id, timestamp) | Audit log filtering |
| AuditLog | (workspace_id, user_id) | User activity |
| CsvImportJob | (workspace_id, created_at) | Import history |
| Config | (workspace_id, key_name) | Config lookup |

**Total Indexes:** 17 (optimized for read-heavy operations)

---

## Data Volume Estimates

### Expected Scale

| Table | Estimated Records | Growth Rate |
|-------|------------------|-------------|
| Workspace | 1-10 | Stable |
| User | 10-100 per workspace | Low |
| Entity | 5-50 per workspace | Low |
| Department | 10-100 per workspace | Low |
| Law | 20-200 per workspace | Medium |
| ComplianceMaster | 50-500 per workspace | Medium |
| ComplianceTask | 1,000-10,000 per workspace | High |
| TaskExecution | 1,000-20,000 per workspace | High |
| EvidenceFile | 2,000-50,000 per workspace | High |
| CsvImportJob | 100-1,000 per workspace | Low |
| CsvImportJobRow | 10,000-100,000 per workspace | Medium |
| AuditLog | 10,000-100,000 per workspace | High |
| ReportRun | 50-500 per workspace | Low |
| Config | 10-50 per workspace | Stable |

**Storage Estimates:**
- Small deployment (1 year): ~100 MB
- Medium deployment (1 year): ~1 GB
- Large deployment (1 year): ~5 GB

**Note:** Evidence files stored in SharePoint (not database)

---

## Security Features

### Data Protection

**Workspace Isolation:**
- All queries filtered by workspace_id
- Prevents cross-workspace data access
- Enforced at ORM level (Prisma middleware)

**Encryption:**
- Config table: AES-256-CBC for sensitive values
- Passwords: Not stored (Microsoft SSO only)
- Session tokens: JWT in HTTP-only cookies

**Audit Trail:**
- All user actions logged
- Immutable audit records
- Comprehensive change tracking

### Access Control

**Row-Level Security:**
- Task owners see only their tasks
- Reviewers see assigned review tasks
- Admins see all workspace data

**Soft Delete:**
- Users: is_active flag (retain audit history)
- Configs: active flag (disable without delete)

---

## Database Maintenance

### Backup Strategy

**Recommended:**
- Daily full backups
- Hourly transaction log backups
- 30-day retention minimum
- Point-in-time recovery enabled

### Migration Strategy

**Prisma Migrations:**
```bash
# Development
pnpm db:migrate

# Production
pnpm db:migrate:deploy
```

**Version Control:**
- All migrations in Git
- Sequential naming
- Rollback capability

### Performance Monitoring

**Key Metrics:**
- Query response time < 100ms
- Index usage > 95%
- Connection pool utilization < 80%
- Lock wait time < 10ms

**Optimization:**
- Regular VACUUM ANALYZE
- Index maintenance
- Query plan analysis
- Slow query logging

---

## Integration Points

### External Systems

**Microsoft SharePoint:**
- Evidence files stored externally
- Metadata in evidence_files table
- Connection config in configs table

**Microsoft Teams:**
- Webhook URL in configs table
- Report execution tracked in report_runs
- No data stored externally

**Microsoft Entra ID:**
- User authentication only
- ms_oid stored for reference
- No password storage

---

## Sample Queries

### Common Operations

**Get User's Pending Tasks:**
```sql
SELECT t.*, e.name as entity_name, d.name as dept_name, l.name as law_name
FROM compliance_tasks t
JOIN entities e ON t.entity_id = e.id
JOIN departments d ON t.department_id = d.id
JOIN laws l ON t.law_id = l.id
WHERE t.workspace_id = $1
  AND t.owner_id = $2
  AND t.status = 'PENDING'
ORDER BY t.due_date ASC;
```

**Get Overdue Tasks Count:**
```sql
SELECT COUNT(*)
FROM compliance_tasks
WHERE workspace_id = $1
  AND status = 'PENDING'
  AND due_date < NOW();
```

**Department Compliance Statistics:**
```sql
SELECT 
  d.name as department,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN t.status = 'SKIPPED' THEN 1 ELSE 0 END) as skipped
FROM departments d
LEFT JOIN compliance_tasks t ON d.id = t.department_id
WHERE d.workspace_id = $1
GROUP BY d.id, d.name;
```

---

## Database Diagram Legend

```
┌─────────────┐
│ TABLE_NAME  │  Primary table
└─────────────┘

PK: Primary Key
FK: Foreign Key
ENUM: Enumeration type
JSON: JSON data type

Relationship Notation:
(1) ──< (M)  = One-to-Many
───>         = Foreign Key reference
CASCADE      = Delete cascades to children
RESTRICT     = Prevent delete if referenced
SET NULL     = Set FK to NULL on delete
```

---

## Schema Statistics

**Total Tables:** 14  
**Total Enums:** 4 (UserRole, TaskStatus, TaskFrequency, TaskImpact, ImportStatus)  
**Total Relationships:** 28  
**Total Indexes:** 17  
**Total Unique Constraints:** 8  

**Database Engine:** PostgreSQL 14+  
**Character Set:** UTF-8  
**Collation:** Case-insensitive (for search)  
**Time Zone:** UTC (all timestamps)

---

**Document Prepared By:** ByteLights Private Limited  
**Database Design:** Production-Ready  
**Version:** 1.0  
**Date:** January 24, 2026

---

*This database schema is optimized for performance, scalability, and data integrity. All tables follow PostgreSQL best practices and support the complete feature set of the Compliance Management System.*
