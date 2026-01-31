# DATABASE TABLES - ROLES & RESPONSIBILITIES

**ByteLights Private Limited**  
**Compliance Management System**  
**Complete Table Reference Guide**

---

## 📚 TABLE OF CONTENTS

1. [User Management](#1-users)
2. [Master Data Tables](#2-master-data-tables)
3. [Core Compliance Tables](#3-core-compliance-tables)
4. [Evidence Management](#4-evidence_files)
5. [CSV Import System](#5-csv-import-tables)
6. [Audit & Reporting](#6-audit--reporting-tables)
7. [System Configuration](#7-configs)

---

## 1. **users**

### 🎯 **Role:**
Central authentication and authorization table for the application.

### 📋 **Responsibilities:**
- Store user account information
- Manage role-based access control (RBAC)
- Track Microsoft SSO integration
- Monitor user activity (last login)
- Control account activation/deactivation

### 🔑 **Key Fields:**
- `email` - Unique identifier (Microsoft account)
- `role` - Determines access level (admin, reviewer, task_owner)
- `msOid` - Microsoft Object ID for SSO integration
- `isActive` - Soft delete mechanism

### 💼 **Business Logic:**
- **Admin**: Full system access, can manage users, all CRUD operations
- **Reviewer**: Can view and review all compliance tasks
- **Task Owner**: Can only view and update their assigned tasks

### 🔗 **Relationships:**
- **Owns** compliance_tasks (via ownerId)
- **Reviews** compliance_tasks (via reviewerId)
- **Uploads** evidence_files (via uploadedById)
- **Performs** audit_logs (via userId)
- **Imports** csv_import_jobs (via uploadedBy)

### 📊 **Usage Example:**
```sql
-- Get all active admins
SELECT * FROM users 
WHERE role = 'admin' AND "isActive" = true;

-- Track user's last activity
UPDATE users 
SET "lastLoginAt" = NOW() 
WHERE id = 'user-uuid';
```

---

## 2. **MASTER DATA TABLES**

### 2.1 **entities**

#### 🎯 **Role:**
Repository of organizational entities/branches where compliance tasks are performed.

#### 📋 **Responsibilities:**
- Store company branches/offices/locations
- Enable task assignment to specific entities
- Support multi-location compliance tracking
- Maintain entity hierarchy (if needed in future)

#### 🔑 **Key Fields:**
- `name` - Unique entity identifier (e.g., "Mumbai Office")

#### 💼 **Business Logic:**
- Each compliance task must be assigned to one entity
- Entity names must be globally unique
- Cannot delete entity if tasks exist (data integrity)

#### 🔗 **Relationships:**
- **Has** compliance_tasks (one entity has many tasks)

#### 📊 **Usage Example:**
```sql
-- Create new entity
INSERT INTO entities (id, name) 
VALUES (gen_random_uuid(), 'Bangalore Office');

-- Get all tasks for an entity
SELECT * FROM compliance_tasks 
WHERE "entityId" = 'entity-uuid';
```

#### 🌍 **Real-World Example:**
```
Corporate Structure:
├── Mumbai Office (Head Office)
├── Delhi Branch
├── Bangalore Tech Center
└── Pune Manufacturing Plant

Each needs separate compliance tracking!
```

---

### 2.2 **departments**

#### 🎯 **Role:**
Master data for organizational departments responsible for compliance activities.

#### 📋 **Responsibilities:**
- Define departments accountable for compliance
- Enable department-wise reporting
- Track compliance by functional area
- Support cross-department compliance requirements

#### 🔑 **Key Fields:**
- `name` - Unique department name (e.g., "Legal", "Finance")

#### 💼 **Business Logic:**
- Each task belongs to one responsible department
- Each compliance master template owned by one department
- Department-wise dashboards and reports
- Cannot delete if tasks/templates exist

#### 🔗 **Relationships:**
- **Responsible for** compliance_tasks
- **Owns** compliances_master templates

#### 📊 **Usage Example:**
```sql
-- Department-wise compliance stats
SELECT 
  d.name,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
FROM departments d
LEFT JOIN compliance_tasks t ON d.id = t."departmentId"
GROUP BY d.id, d.name;
```

#### 🌍 **Real-World Example:**
```
Departments & Their Compliance:
├── Legal (Companies Act, SEBI regulations)
├── Finance (GST, TDS, Audit requirements)
├── HR (Labor laws, PF, ESI)
└── Operations (Safety, Environmental compliance)
```

---

### 2.3 **laws**

#### 🎯 **Role:**
Master repository of regulatory laws and regulations requiring compliance.

#### 📋 **Responsibilities:**
- Store all applicable laws/regulations
- Link compliance requirements to legal framework
- Provide reference for compliance tasks
- Enable law-wise compliance tracking

#### 🔑 **Key Fields:**
- `name` - Unique law identifier (e.g., "Companies Act 2013")
- `description` - Detailed law information

#### 💼 **Business Logic:**
- Each task must reference one law
- Each compliance template must reference one law
- Law-wise compliance reporting
- Supports regulatory change tracking

#### 🔗 **Relationships:**
- **Governs** compliance_tasks
- **Governs** compliances_master templates

#### 📊 **Usage Example:**
```sql
-- Get all tasks for specific law
SELECT t.* 
FROM compliance_tasks t
JOIN laws l ON t."lawId" = l.id
WHERE l.name = 'Companies Act 2013';

-- Track law-wise compliance rate
SELECT 
  l.name,
  COUNT(t.id) as total,
  ROUND(100.0 * SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(t.id), 2) as compliance_rate
FROM laws l
LEFT JOIN compliance_tasks t ON l.id = t."lawId"
GROUP BY l.id, l.name;
```

#### 🌍 **Real-World Example:**
```
Indian Compliance Laws:
├── Companies Act 2013 (Section 173, 179, etc.)
├── SEBI Regulations
├── GST Act
├── Income Tax Act
├── Labor Laws
└── Environmental Protection Act
```

---

### 2.4 **compliances_master**

#### 🎯 **Role:**
Template library for standard, recurring compliance requirements.

#### 📋 **Responsibilities:**
- Store standardized compliance definitions
- Enable bulk task creation
- Maintain consistency across similar tasks
- Support CSV import auto-fill
- Provide reusable compliance blueprints

#### 🔑 **Key Fields:**
- `complianceId` - Human-readable ID (COMP-001)
- `name` - Unique template name
- `title` - Task title template
- `frequency` - How often it recurs (DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY)
- `impact` - Business impact (HIGH/MEDIUM/LOW)

#### 💼 **Business Logic:**
- Acts as template for creating compliance_tasks
- Used in CSV import to auto-fill task details
- Manual task creation can reference template
- Reduces data entry errors
- Ensures compliance standardization

#### 🔗 **Relationships:**
- **Referenced by** laws (which law it complies with)
- **Owned by** departments (responsible department)
- **Template for** compliance_tasks (tasks created from this)

#### 📊 **Usage Example:**
```sql
-- Create template
INSERT INTO compliances_master (
  id, "complianceId", name, title, "lawId", "departmentId", frequency, impact
) VALUES (
  gen_random_uuid(),
  'COMP-001',
  'Board Meeting Minutes',
  'Quarterly Board Meeting Documentation',
  'law-companies-act-uuid',
  'dept-legal-uuid',
  'QUARTERLY',
  'HIGH'
);

-- Use template to create task
INSERT INTO compliance_tasks (
  id, "complianceId", title, description, 
  "lawId", "departmentId", "entityId", 
  "ownerId", "reviewerId", "complianceMasterId"
)
SELECT 
  gen_random_uuid(),
  cm."complianceId",
  cm.title,
  cm.description,
  cm."lawId",
  cm."departmentId",
  'entity-mumbai-uuid',
  'user-owner-uuid',
  'user-reviewer-uuid',
  cm.id
FROM compliances_master cm
WHERE cm.id = 'template-uuid';
```

#### 🌍 **Real-World Example:**
```
ComplianceMaster Templates:
├── COMP-001: Board Meeting Minutes (Quarterly)
├── COMP-002: GST Returns Filing (Quarterly)
├── COMP-003: TDS Filing (Monthly)
├── COMP-004: Annual General Meeting (Yearly)
└── COMP-005: Statutory Audit Report (Yearly)

Used to create 100+ tasks across 10 entities in minutes!
```

---

## 3. **CORE COMPLIANCE TABLES**

### 3.1 **compliance_tasks**

#### 🎯 **Role:**
**THE MAIN TABLE** - Core business entity for tracking compliance activities.

#### 📋 **Responsibilities:**
- Track all compliance tasks lifecycle
- Manage task assignments (owner, reviewer)
- Monitor due dates and overdue status
- Link evidence to compliance requirements
- Enable status tracking (PENDING → COMPLETED/SKIPPED)
- Support compliance reporting and dashboards

#### 🔑 **Key Fields:**
- `id` - Unique task identifier
- `complianceId` - Human-readable reference (COMP-001)
- `status` - Task state (PENDING/COMPLETED/SKIPPED)
- `dueDate` - Compliance deadline
- `ownerId` - User responsible for completion
- `reviewerId` - User responsible for review/approval
- `entityId` - Where compliance applies
- `complianceMasterId` - Source template (if created from master)

#### 💼 **Business Logic:**

**Task Lifecycle:**
```
CREATE → PENDING → (Upload Evidence) → COMPLETED
              ↓
            SKIPPED (with reason)
```

**Overdue Calculation:**
```sql
-- A task is overdue if:
status = 'PENDING' AND "dueDate" < CURRENT_DATE
```

**Business Rules:**
- Cannot complete without evidence upload
- Only owner can update task
- Reviewer can approve/reject completion
- One compliance per entity (unique constraint)
- Cannot delete completed tasks (audit trail)

#### 🔗 **Relationships:**
- **Owned by** users (ownerId)
- **Reviewed by** users (reviewerId)
- **Applies to** entities (entityId)
- **Governed by** laws (lawId)
- **Managed by** departments (departmentId)
- **Created from** compliances_master (complianceMasterId)
- **Has** evidence_files (multiple evidence per task)

#### 📊 **Usage Example:**
```sql
-- Get pending tasks for user
SELECT t.* 
FROM compliance_tasks t
WHERE t."ownerId" = 'user-uuid' 
  AND t.status = 'PENDING'
ORDER BY t."dueDate" ASC;

-- Get overdue tasks
SELECT * FROM compliance_tasks
WHERE status = 'PENDING' 
  AND "dueDate" < CURRENT_DATE;

-- Complete a task
UPDATE compliance_tasks
SET status = 'COMPLETED',
    "completedAt" = NOW()
WHERE id = 'task-uuid';

-- Department-wise pending count
SELECT 
  d.name,
  COUNT(*) as pending_count
FROM compliance_tasks t
JOIN departments d ON t."departmentId" = d.id
WHERE t.status = 'PENDING'
GROUP BY d.name;
```

#### 🌍 **Real-World Example:**
```
Task: Board Meeting Minutes - Q1 2026
├── Compliance ID: COMP-001
├── Entity: Mumbai Office
├── Due Date: 31-Mar-2026
├── Owner: John Doe (Legal Manager)
├── Reviewer: Jane Smith (Legal Head)
├── Status: PENDING
├── Evidence Required: Yes (Meeting minutes PDF)
└── Created from: Template "Board Meeting Minutes"

Workflow:
1. John receives task notification
2. Conducts board meeting, takes minutes
3. Uploads meeting minutes to SharePoint
4. Marks task as COMPLETED
5. Jane reviews and approves
6. Task closed, audit trail maintained
```

---

## 4. **evidence_files**

#### 🎯 **Role:**
Metadata repository for compliance evidence files stored in SharePoint.

#### 📋 **Responsibilities:**
- Track evidence files for compliance tasks
- Store SharePoint file references
- Maintain upload history
- Enable evidence retrieval
- Support compliance audit trail

#### 🔑 **Key Fields:**
- `taskId` - Related compliance task
- `fileName` - Original file name
- `fileSize` - Size in bytes
- `sharepointFileId` - SharePoint reference
- `sharepointWebUrl` - Direct SharePoint link
- `uploadedById` - Who uploaded

#### 💼 **Business Logic:**
- Files physically stored in SharePoint (not DB)
- DB only stores metadata and links
- Multiple evidence files per task allowed
- Cannot delete evidence after task completion
- Evidence required for task completion

#### 🔗 **Relationships:**
- **Belongs to** compliance_tasks (taskId)
- **Uploaded by** users (uploadedById)

#### 📊 **Usage Example:**
```sql
-- Get all evidence for a task
SELECT * FROM evidence_files
WHERE "taskId" = 'task-uuid'
ORDER BY "uploadedAt" DESC;

-- Check if task has evidence
SELECT COUNT(*) > 0 as has_evidence
FROM evidence_files
WHERE "taskId" = 'task-uuid';

-- Get user's uploaded files
SELECT 
  ef.*,
  t.title as task_title
FROM evidence_files ef
JOIN compliance_tasks t ON ef."taskId" = t.id
WHERE ef."uploadedById" = 'user-uuid'
ORDER BY ef."uploadedAt" DESC;
```

#### 🌍 **Real-World Example:**
```
Evidence for: Board Meeting Minutes - Q1 2026
├── File 1: Board_Meeting_Minutes_Q1_2026.pdf (2.5 MB)
│   ├── SharePoint ID: abc123xyz
│   ├── URL: https://sharepoint.com/...
│   ├── Uploaded by: John Doe
│   └── Uploaded at: 2026-03-25 10:30 AM
│
└── File 2: Attendance_Sheet.pdf (500 KB)
    ├── SharePoint ID: def456uvw
    ├── URL: https://sharepoint.com/...
    ├── Uploaded by: John Doe
    └── Uploaded at: 2026-03-25 10:32 AM

Both files stored in SharePoint, metadata in DB
```

---

## 5. **CSV IMPORT TABLES**

### 5.1 **csv_import_jobs**

#### 🎯 **Role:**
Track bulk compliance task imports via CSV files.

#### 📋 **Responsibilities:**
- Record CSV import attempts
- Track validation results
- Monitor import success/failure
- Enable import history review
- Support preview before commit

#### 🔑 **Key Fields:**
- `fileName` - Uploaded CSV name
- `totalRows` - Total rows in CSV
- `validRows` - Successfully validated rows
- `errorRows` - Rows with errors
- `status` - PENDING/COMPLETED/FAILED
- `mode` - PREVIEW (validate only) or COMMIT (create tasks)

#### 💼 **Business Logic:**

**Import Modes:**
- **PREVIEW**: Validates CSV without creating tasks (dry run)
- **COMMIT**: Creates tasks after validation

**Workflow:**
```
Upload CSV → PREVIEW (validate) → Review errors → COMMIT (create)
```

#### 🔗 **Relationships:**
- **Uploaded by** users (uploadedBy)
- **Contains** csv_import_job_rows (validation details)

#### 📊 **Usage Example:**
```sql
-- Get user's import history
SELECT * FROM csv_import_jobs
WHERE "uploadedBy" = 'user-uuid'
ORDER BY "createdAt" DESC;

-- Get failed imports
SELECT * FROM csv_import_jobs
WHERE status = 'FAILED';

-- Import success rate
SELECT 
  COUNT(*) as total_imports,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM csv_import_jobs;
```

---

### 5.2 **csv_import_job_rows**

#### 🎯 **Role:**
Store validation results for individual CSV rows.

#### 📋 **Responsibilities:**
- Track per-row validation results
- Store error messages for failed rows
- Preserve original row data
- Enable error correction
- Support re-import after fixes

#### 🔑 **Key Fields:**
- `jobId` - Parent import job
- `rowNumber` - Row number in CSV
- `isValid` - Validation result (true/false)
- `errorMessage` - Error details if invalid
- `rowData` - Original CSV row (JSON)

#### 💼 **Business Logic:**
- One record per CSV row
- Invalid rows show specific error messages
- User can download error report
- Fix errors and re-upload

#### 🔗 **Relationships:**
- **Belongs to** csv_import_jobs (jobId)

#### 📊 **Usage Example:**
```sql
-- Get errors for an import
SELECT 
  "rowNumber",
  "errorMessage",
  "rowData"
FROM csv_import_job_rows
WHERE "jobId" = 'job-uuid'
  AND "isValid" = false
ORDER BY "rowNumber";

-- Count errors by type
SELECT 
  "errorMessage",
  COUNT(*) as count
FROM csv_import_job_rows
WHERE "jobId" = 'job-uuid'
  AND "isValid" = false
GROUP BY "errorMessage";
```

#### 🌍 **Real-World Example:**
```
CSV Import: 100 tasks
├── Job ID: job-123
├── File: Q1_2026_Compliance_Tasks.csv
├── Total Rows: 100
├── Valid Rows: 95
├── Error Rows: 5
│
└── Error Details:
    ├── Row 12: "Invalid email for owner"
    ├── Row 23: "Entity 'Delhi Branch' not found"
    ├── Row 45: "Due date in past"
    ├── Row 67: "Duplicate complianceId-entityId"
    └── Row 89: "Missing required field: reviewerId"

User can fix these 5 rows and re-upload!
```

---

## 6. **AUDIT & REPORTING TABLES**

### 6.1 **audit_logs**

#### 🎯 **Role:**
Comprehensive audit trail for security, compliance, and forensics.

#### 📋 **Responsibilities:**
- Record all significant system actions
- Track user activities
- Support compliance audits
- Enable forensic investigation
- Maintain tamper-proof history
- Meet regulatory requirements

#### 🔑 **Key Fields:**
- `userId` - Who performed action
- `action` - What was done (CREATE/UPDATE/DELETE)
- `entityType` - What was changed (TASK/USER/EVIDENCE)
- `entityId` - Which record was changed
- `changes` - Before/after values (JSON)
- `ipAddress` - User's IP
- `userAgent` - User's browser
- `timestamp` - When it happened

#### 💼 **Business Logic:**
- **Immutable**: Cannot update or delete audit logs
- Records ALL significant actions:
  - User login/logout
  - Task creation/update/completion
  - Evidence upload/deletion
  - User role changes
  - Config changes
- Used for compliance audits
- Retention: Minimum 7 years (regulatory requirement)

#### 🔗 **Relationships:**
- **Performed by** users (userId)

#### 📊 **Usage Example:**
```sql
-- Recent activity
SELECT 
  al.*,
  u.name as user_name
FROM audit_logs al
JOIN users u ON al."userId" = u.id
ORDER BY al.timestamp DESC
LIMIT 50;

-- Track specific task changes
SELECT * FROM audit_logs
WHERE "entityType" = 'TASK'
  AND "entityId" = 'task-uuid'
ORDER BY timestamp DESC;

-- User activity report
SELECT 
  u.name,
  COUNT(*) as action_count,
  MAX(al.timestamp) as last_action
FROM audit_logs al
JOIN users u ON al."userId" = u.id
GROUP BY u.id, u.name
ORDER BY action_count DESC;

-- Suspicious activity (multiple deletes)
SELECT 
  "userId",
  COUNT(*) as delete_count
FROM audit_logs
WHERE action = 'DELETE'
  AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY "userId"
HAVING COUNT(*) > 10;
```

#### 🌍 **Real-World Example:**
```
Audit Trail for Task Completion:

2026-03-25 10:30:15 | John Doe | CREATE | TASK | task-123
  → Created task "Board Meeting Minutes - Q1"

2026-03-25 14:22:30 | John Doe | CREATE | EVIDENCE | evidence-456
  → Uploaded "Board_Meeting_Minutes.pdf"

2026-03-25 14:25:00 | John Doe | UPDATE | TASK | task-123
  → Changed status: PENDING → COMPLETED
  → Changes: { "status": ["PENDING", "COMPLETED"], "completedAt": [null, "2026-03-25T14:25:00"] }

2026-03-26 09:15:00 | Jane Smith | UPDATE | TASK | task-123
  → Reviewed and approved

Complete audit trail maintained for compliance!
```

---

### 6.2 **report_runs**

#### 🎯 **Role:**
Track automated compliance report generation and delivery.

#### 📋 **Responsibilities:**
- Record weekly report runs
- Track report success/failure
- Store report metadata
- Enable report scheduling monitoring
- Support report delivery verification

#### 🔑 **Key Fields:**
- `reportType` - Type of report (WEEKLY_COMPLIANCE)
- `periodStart` - Report period start date
- `periodEnd` - Report period end date
- `status` - SUCCESS/FAILED
- `errorMessage` - Error details if failed
- `metadata` - Report statistics (JSON)

#### 💼 **Business Logic:**
- Auto-created by cron job (weekly)
- Records report delivery to Teams
- Tracks report generation failures
- Enables report delivery monitoring

#### 🔗 **Relationships:**
- None (standalone tracking table)

#### 📊 **Usage Example:**
```sql
-- Recent report runs
SELECT * FROM report_runs
ORDER BY "createdAt" DESC
LIMIT 10;

-- Failed reports
SELECT * FROM report_runs
WHERE status = 'FAILED'
ORDER BY "createdAt" DESC;

-- Report generation success rate
SELECT 
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM report_runs
WHERE "createdAt" > NOW() - INTERVAL '90 days';
```

#### 🌍 **Real-World Example:**
```
Weekly Compliance Report - Week 12 of 2026
├── Report Type: WEEKLY_COMPLIANCE
├── Period: 2026-03-17 to 2026-03-23
├── Generated: 2026-03-24 09:00 AM
├── Status: SUCCESS
├── Delivered to: Microsoft Teams #compliance-channel
└── Metadata:
    ├── Total Tasks: 150
    ├── Completed: 120 (80%)
    ├── Pending: 25 (17%)
    ├── Overdue: 5 (3%)
    └── Delivery Time: 2.3 seconds
```

---

## 7. **configs**

#### 🎯 **Role:**
Centralized system configuration key-value store.

#### 📋 **Responsibilities:**
- Store SharePoint integration settings
- Store Teams webhook URL
- Store report scheduling settings
- Manage encrypted sensitive values
- Enable runtime configuration updates
- Support multi-environment configs

#### 🔑 **Key Fields:**
- `keyName` - Unique configuration key
- `value` - Configuration value (encrypted if sensitive)
- `active` - Enable/disable config

#### 💼 **Business Logic:**
- Sensitive values encrypted with AES-256-CBC
- Single source of truth for integrations
- Can update without code deployment
- Active flag for feature toggles

#### 🔗 **Relationships:**
- None (standalone config table)

#### 📊 **Common Configs:**
```
sharepoint_site_id       → SharePoint site ID
sharepoint_drive_id      → SharePoint drive ID
sharepoint_base_folder   → Base folder name
teams_webhook_url        → Teams webhook (encrypted)
teams_report_day         → Report day (0-6, Sunday-Saturday)
teams_report_time        → Report time (HH:MM format)
report_timezone          → Timezone (Asia/Kolkata)
```

#### 📊 **Usage Example:**
```sql
-- Get SharePoint config
SELECT * FROM configs
WHERE "keyName" IN (
  'sharepoint_site_id',
  'sharepoint_drive_id',
  'sharepoint_base_folder'
);

-- Update Teams webhook
UPDATE configs
SET value = 'new-encrypted-webhook-url',
    "updatedAt" = NOW()
WHERE "keyName" = 'teams_webhook_url';

-- Disable feature
UPDATE configs
SET active = false
WHERE "keyName" = 'teams_weekly_report';
```

#### 🌍 **Real-World Example:**
```
System Configurations:
├── SharePoint Integration
│   ├── site_id: "abc-123-def"
│   ├── drive_id: "xyz-456-uvw"
│   └── base_folder: "Compliance_Evidence"
│
├── Teams Integration
│   ├── webhook_url: [ENCRYPTED]
│   ├── report_day: 1 (Monday)
│   ├── report_time: "09:00"
│   └── timezone: "Asia/Kolkata"
│
└── Feature Flags
    ├── teams_weekly_report: true
    └── csv_import_enabled: true

All configs updateable via Admin UI!
```

---

## 📊 **TABLE DEPENDENCY HIERARCHY**

```
Level 1 (Independent - No dependencies):
├── users
├── entities
├── departments
└── laws

Level 2 (Depends on Level 1):
└── compliances_master
    ├── Depends on: laws, departments

Level 3 (Depends on Level 1 & 2):
└── compliance_tasks
    ├── Depends on: users, entities, departments, laws, compliances_master

Level 4 (Depends on Level 3):
├── evidence_files (depends on: compliance_tasks, users)
└── audit_logs (depends on: users)

Independent Tables (No foreign keys):
├── csv_import_jobs → csv_import_job_rows
├── report_runs
└── configs
```

---

## 🎯 **CORE WORKFLOW THROUGH TABLES**

### **Complete Task Lifecycle:**

```
1. SETUP (Master Data):
   users → Created via Microsoft SSO
   entities → Admin creates "Mumbai Office"
   departments → Admin creates "Legal"
   laws → Admin creates "Companies Act 2013"
   compliances_master → Admin creates "Board Meeting" template

2. TASK CREATION:
   compliance_tasks → Created from template
   ├── References: entity, department, law, master
   ├── Assigns: owner, reviewer
   └── Sets: due date, status=PENDING

3. TASK EXECUTION:
   evidence_files → Owner uploads evidence to SharePoint
   ├── Metadata stored in DB
   └── taskId links to compliance_task

4. TASK COMPLETION:
   compliance_tasks → status updated to COMPLETED
   └── completedAt timestamp set

5. AUDIT TRAIL:
   audit_logs → Every action recorded
   ├── Task creation logged
   ├── Evidence upload logged
   └── Task completion logged

6. REPORTING:
   report_runs → Weekly report generated
   └── Delivered to Teams channel
```

---

## ✅ **SUMMARY TABLE**

| Table | Type | Main Purpose | Can Delete? | Critical? |
|-------|------|--------------|-------------|-----------|
| users | Core | Authentication & RBAC | No (soft delete) | ⭐⭐⭐⭐⭐ |
| entities | Master | Organizational locations | No (if tasks exist) | ⭐⭐⭐⭐ |
| departments | Master | Functional areas | No (if tasks exist) | ⭐⭐⭐⭐ |
| laws | Master | Regulatory framework | No (if tasks exist) | ⭐⭐⭐⭐ |
| compliances_master | Template | Task blueprints | Yes | ⭐⭐⭐ |
| compliance_tasks | Core | Main business entity | No (after completion) | ⭐⭐⭐⭐⭐ |
| evidence_files | Evidence | Proof of compliance | No (after completion) | ⭐⭐⭐⭐⭐ |
| csv_import_jobs | Utility | Bulk import tracking | Yes (after time) | ⭐⭐ |
| csv_import_job_rows | Utility | Import details | Yes (with job) | ⭐⭐ |
| audit_logs | Audit | Security & compliance | Never | ⭐⭐⭐⭐⭐ |
| report_runs | Reporting | Report delivery tracking | Yes (after time) | ⭐⭐⭐ |
| configs | Config | System settings | No | ⭐⭐⭐⭐ |

---

## 🔍 **QUICK REFERENCE**

### **Which table to use when:**

**Creating user accounts?** → `users`  
**Adding new office?** → `entities`  
**Adding department?** → `departments`  
**Adding law/regulation?** → `laws`  
**Creating compliance template?** → `compliances_master`  
**Creating actual task?** → `compliance_tasks`  
**Uploading evidence?** → `evidence_files`  
**Bulk importing tasks?** → `csv_import_jobs` + `csv_import_job_rows`  
**Tracking user actions?** → `audit_logs`  
**Monitoring reports?** → `report_runs`  
**Storing system settings?** → `configs`

---

**DOCUMENT COMPLETE** ✅

*This document explains the role and responsibility of every table in the Compliance Management System database.*

---

*ByteLights Private Limited - Compliance Management System*  
*Database Tables Reference - Version 2.0*
