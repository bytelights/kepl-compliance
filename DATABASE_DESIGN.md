# DATABASE DESIGN - Compliance Management System

**ByteLights Private Limited**  
**Version:** 2.0 (Single-Vendor Architecture)  
**Date:** January 24, 2026  
**Database:** PostgreSQL 15+

---

## 📊 ENTITY RELATIONSHIP DIAGRAM (ERD)

```
┌─────────────────┐
│     User        │
│─────────────────│
│ id (PK)         │◄─────┐
│ email (UNIQUE)  │      │
│ name            │      │
│ role            │      │
│ msOid           │      │
│ isActive        │      │
│ lastLoginAt     │      │
│ createdAt       │      │
│ updatedAt       │      │
└─────────────────┘      │
         │               │
         │ ownerId       │ reviewerId
         │               │
         ▼               │
┌─────────────────────────────┐
│    ComplianceTask          │
│─────────────────────────────│
│ id (PK)                    │
│ complianceId               │
│ title                      │
│ description                │
│ status                     │
│ dueDate                    │
│ completedAt                │
│ skippedAt                  │
│ lawId (FK) ────────────────┼──────┐
│ departmentId (FK) ─────────┼─┐    │
│ entityId (FK) ─────────────┼─┼─┐  │
│ ownerId (FK) ──────────────┘ │ │  │
│ reviewerId (FK)              │ │  │
│ complianceMasterId (FK)      │ │  │
│ frequency                    │ │  │
│ impact                       │ │  │
│ createdAt                    │ │  │
│ updatedAt                    │ │  │
└──────────────────────────────┘ │  │
         │                       │  │
         │ taskId                │  │
         ▼                       │  │
┌─────────────────────┐          │  │
│   EvidenceFile      │          │  │
│─────────────────────│          │  │
│ id (PK)             │          │  │
│ taskId (FK)         │          │  │
│ fileName            │          │  │
│ fileSize            │          │  │
│ mimeType            │          │  │
│ sharepointFileId    │          │  │
│ sharepointWebUrl    │          │  │
│ uploadedById (FK)   │          │  │
│ uploadedAt          │          │  │
└─────────────────────┘          │  │
                                 │  │
┌─────────────────┐              │  │
│   Department    │◄─────────────┘  │
│─────────────────│                 │
│ id (PK)         │                 │
│ name (UNIQUE)   │                 │
│ createdAt       │                 │
│ updatedAt       │                 │
└─────────────────┘                 │
                                    │
┌─────────────────┐                 │
│     Entity      │◄────────────────┘
│─────────────────│
│ id (PK)         │
│ name (UNIQUE)   │
│ createdAt       │
│ updatedAt       │
└─────────────────┘

┌──────────────────────┐            ┌─────────────────┐
│  ComplianceMaster    │            │      Law        │
│──────────────────────│            │─────────────────│
│ id (PK)              │            │ id (PK)         │
│ complianceId         │            │ name (UNIQUE)   │
│ name (UNIQUE)        │            │ description     │
│ title                │            │ createdAt       │
│ description          │            │ updatedAt       │
│ lawId (FK) ──────────┼───────────►│                 │
│ departmentId (FK)    │            └─────────────────┘
│ frequency            │
│ impact               │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘

┌─────────────────────┐
│   CsvImportJob      │
│─────────────────────│
│ id (PK)             │
│ fileName            │
│ totalRows           │
│ validRows           │
│ errorRows           │
│ status              │
│ mode                │
│ uploadedBy (FK) ────┼──► User
│ createdAt           │
└─────────────────────┘
         │
         │ jobId
         ▼
┌─────────────────────┐
│ CsvImportJobRow     │
│─────────────────────│
│ id (PK)             │
│ jobId (FK)          │
│ rowNumber           │
│ isValid             │
│ errorMessage        │
│ rowData (JSON)      │
│ createdAt           │
└─────────────────────┘

┌─────────────────────┐
│     AuditLog        │
│─────────────────────│
│ id (PK)             │
│ userId (FK) ────────┼──► User
│ action              │
│ entityType          │
│ entityId            │
│ changes (JSON)      │
│ ipAddress           │
│ userAgent           │
│ timestamp           │
└─────────────────────┘

┌─────────────────────┐
│     ReportRun       │
│─────────────────────│
│ id (PK)             │
│ reportType          │
│ periodStart         │
│ periodEnd           │
│ status              │
│ errorMessage        │
│ metadata (JSON)     │
│ createdAt           │
└─────────────────────┘

┌─────────────────────┐
│      Config         │
│─────────────────────│
│ id (PK)             │
│ keyName (UNIQUE)    │
│ value               │
│ active              │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

---

## 📋 TABLE SPECIFICATIONS

### 1. **users** (Authentication & User Management)

**Purpose:** Store user accounts for role-based access control

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User email (Microsoft account) |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `role` | ENUM | NOT NULL, DEFAULT 'task_owner' | User role (admin, reviewer, task_owner) |
| `msOid` | VARCHAR(255) | NULL | Microsoft Object ID for SSO |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Account active status |
| `lastLoginAt` | TIMESTAMP | NULL | Last successful login |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation date |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` ON (email)
- `idx_users_role` ON (role)

**Business Rules:**
- Email must be unique globally
- Roles: `admin` (full access), `reviewer` (view + review), `task_owner` (assigned tasks only)
- Users are auto-created on first Microsoft SSO login
- Soft delete via `isActive = false`

---

### 2. **entities** (Organization Entities)

**Purpose:** Master data for different organizational entities/branches

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique entity identifier |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Entity name |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Indexes:**
- `idx_entities_name` ON (name)

**Business Rules:**
- Entity names must be unique globally
- Examples: "Corporate Office", "Mumbai Branch", "Delhi Office"

---

### 3. **departments** (Organizational Departments)

**Purpose:** Master data for departments responsible for compliance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique department identifier |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Department name |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Indexes:**
- `idx_departments_name` ON (name)

**Business Rules:**
- Department names must be unique globally
- Examples: "Legal", "Finance", "HR", "Operations"

---

### 4. **laws** (Regulatory Laws)

**Purpose:** Master data for laws/regulations that require compliance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique law identifier |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Law/regulation name |
| `description` | TEXT | NULL | Law description |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Indexes:**
- `idx_laws_name` ON (name)

**Business Rules:**
- Law names must be unique globally
- Examples: "Companies Act 2013", "SEBI Regulations", "GST Act"

---

### 5. **compliances_master** (Compliance Templates)

**Purpose:** Template definitions for recurring compliance tasks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique template identifier |
| `complianceId` | VARCHAR(100) | NOT NULL | Human-readable ID (e.g., COMP-001) |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Template name |
| `title` | VARCHAR(255) | NOT NULL | Task title template |
| `description` | TEXT | NULL | Task description template |
| `lawId` | UUID | NOT NULL, FOREIGN KEY → laws(id) | Related law |
| `departmentId` | UUID | NOT NULL, FOREIGN KEY → departments(id) | Responsible department |
| `frequency` | ENUM | NOT NULL | DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY |
| `impact` | ENUM | NULL | HIGH, MEDIUM, LOW |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Indexes:**
- `idx_compliance_master_name` ON (name)
- `idx_compliance_master_law` ON (lawId)
- `idx_compliance_master_dept` ON (departmentId)

**Business Rules:**
- Used to create bulk compliance tasks
- Defines standard compliance requirements
- Can be used as template for manual task creation

---

### 6. **compliance_tasks** (Main Compliance Tasks)

**Purpose:** Core table for tracking compliance tasks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique task identifier |
| `complianceId` | VARCHAR(100) | NOT NULL | Human-readable ID |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | NULL | Task details |
| `status` | ENUM | NOT NULL, DEFAULT 'PENDING' | PENDING, COMPLETED, SKIPPED |
| `dueDate` | DATE | NULL | Due date |
| `completedAt` | TIMESTAMP | NULL | Completion timestamp |
| `skippedAt` | TIMESTAMP | NULL | Skip timestamp |
| `lawId` | UUID | NOT NULL, FOREIGN KEY → laws(id) | Related law |
| `departmentId` | UUID | NOT NULL, FOREIGN KEY → departments(id) | Responsible department |
| `entityId` | UUID | NOT NULL, FOREIGN KEY → entities(id) | Related entity |
| `ownerId` | UUID | NOT NULL, FOREIGN KEY → users(id) | Task owner |
| `reviewerId` | UUID | NOT NULL, FOREIGN KEY → users(id) | Task reviewer |
| `complianceMasterId` | UUID | NULL, FOREIGN KEY → compliances_master(id) | Source template |
| `frequency` | VARCHAR(50) | NULL | Task frequency |
| `impact` | VARCHAR(50) | NULL | Task impact level |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Unique Constraint:**
- `UNIQUE(complianceId, entityId)` - One compliance per entity

**Indexes:**
- `idx_tasks_status` ON (status)
- `idx_tasks_owner` ON (ownerId)
- `idx_tasks_reviewer` ON (reviewerId)
- `idx_tasks_entity` ON (entityId)
- `idx_tasks_due_date` ON (dueDate)
- `idx_tasks_created_at` ON (createdAt)

**Business Rules:**
- Task owners can update their assigned tasks
- Reviewers can view and approve all tasks
- Admins have full access
- Completing task requires evidence upload
- Overdue = dueDate < today AND status = PENDING

---

### 7. **evidence_files** (Task Evidence)

**Purpose:** Track evidence files uploaded to SharePoint

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique evidence identifier |
| `taskId` | UUID | NOT NULL, FOREIGN KEY → compliance_tasks(id) | Related task |
| `fileName` | VARCHAR(255) | NOT NULL | Original file name |
| `fileSize` | BIGINT | NOT NULL | File size in bytes |
| `mimeType` | VARCHAR(100) | NOT NULL | File MIME type |
| `sharepointFileId` | VARCHAR(255) | NOT NULL | SharePoint file ID |
| `sharepointWebUrl` | VARCHAR(500) | NOT NULL | SharePoint web URL |
| `uploadedById` | UUID | NOT NULL, FOREIGN KEY → users(id) | Uploader |
| `uploadedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |

**Indexes:**
- `idx_evidence_task` ON (taskId)
- `idx_evidence_uploaded_by` ON (uploadedById)
- `idx_evidence_uploaded_at` ON (uploadedAt)

**Business Rules:**
- Files stored in SharePoint, metadata in DB
- Multiple evidence files allowed per task
- Cannot delete evidence once task is completed

---

### 8. **csv_import_jobs** (CSV Import History)

**Purpose:** Track CSV bulk import operations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique job identifier |
| `fileName` | VARCHAR(255) | NOT NULL | Uploaded CSV file name |
| `totalRows` | INT | NOT NULL, DEFAULT 0 | Total rows in CSV |
| `validRows` | INT | NOT NULL, DEFAULT 0 | Valid rows count |
| `errorRows` | INT | NOT NULL, DEFAULT 0 | Error rows count |
| `status` | ENUM | NOT NULL, DEFAULT 'PENDING' | PENDING, COMPLETED, FAILED |
| `mode` | ENUM | NOT NULL | PREVIEW, COMMIT |
| `uploadedBy` | UUID | NOT NULL, FOREIGN KEY → users(id) | User who uploaded |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |

**Indexes:**
- `idx_csv_import_uploaded_by` ON (uploadedBy)
- `idx_csv_import_created_at` ON (createdAt)

**Business Rules:**
- PREVIEW mode: validates without creating tasks
- COMMIT mode: creates tasks after validation
- Auto-creates master data if not exists

---

### 9. **csv_import_job_rows** (CSV Row Details)

**Purpose:** Store individual CSV row validation results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique row identifier |
| `jobId` | UUID | NOT NULL, FOREIGN KEY → csv_import_jobs(id) | Parent job |
| `rowNumber` | INT | NOT NULL | Row number in CSV |
| `isValid` | BOOLEAN | NOT NULL | Validation result |
| `errorMessage` | TEXT | NULL | Error details if invalid |
| `rowData` | JSONB | NOT NULL | Original row data |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_csv_rows_job` ON (jobId)
- `idx_csv_rows_valid` ON (isValid)

**Business Rules:**
- Stores validation errors for user feedback
- Row data preserved for debugging

---

### 10. **audit_logs** (Audit Trail)

**Purpose:** Comprehensive audit trail for compliance & security

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique log identifier |
| `userId` | UUID | NOT NULL, FOREIGN KEY → users(id) | User who performed action |
| `action` | VARCHAR(100) | NOT NULL | Action type (CREATE, UPDATE, DELETE) |
| `entityType` | VARCHAR(100) | NOT NULL | Entity type (TASK, USER, EVIDENCE, etc.) |
| `entityId` | VARCHAR(255) | NULL | Related entity ID |
| `changes` | JSONB | NULL | Before/after changes |
| `ipAddress` | VARCHAR(45) | NULL | User IP address |
| `userAgent` | VARCHAR(500) | NULL | User browser/agent |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_audit_timestamp` ON (timestamp)
- `idx_audit_user` ON (userId)
- `idx_audit_entity` ON (entityType, entityId)

**Business Rules:**
- Immutable (no updates/deletes)
- Captures all significant system actions
- Used for compliance reporting & security

---

### 11. **report_runs** (Report History)

**Purpose:** Track automated report generation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique run identifier |
| `reportType` | VARCHAR(100) | NOT NULL | WEEKLY_COMPLIANCE, MONTHLY, etc. |
| `periodStart` | DATE | NOT NULL | Report period start |
| `periodEnd` | DATE | NOT NULL | Report period end |
| `status` | ENUM | NOT NULL | SUCCESS, FAILED |
| `errorMessage` | TEXT | NULL | Error details if failed |
| `metadata` | JSONB | NULL | Report metadata |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Generation timestamp |

**Indexes:**
- `idx_report_type_period` ON (reportType, periodStart)
- `idx_report_created` ON (createdAt)

**Business Rules:**
- Tracks weekly Teams report runs
- Used for report scheduling & monitoring

---

### 12. **configs** (System Configuration)

**Purpose:** Store system-wide configuration key-value pairs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique config identifier |
| `keyName` | VARCHAR(100) | NOT NULL, UNIQUE | Configuration key |
| `value` | TEXT | NOT NULL | Configuration value (encrypted if sensitive) |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Config active status |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Indexes:**
- `idx_config_key` ON (keyName)

**Stored Configs:**
- `sharepoint_site_id` - SharePoint site ID
- `sharepoint_drive_id` - SharePoint drive ID
- `sharepoint_base_folder` - Base folder name
- `teams_webhook_url` - Teams webhook URL (encrypted)
- `teams_report_day` - Weekly report day (0-6)
- `teams_report_time` - Report time (HH:MM)

**Business Rules:**
- Sensitive values encrypted with AES-256-CBC
- Single source of truth for integration configs

---

## 🔗 RELATIONSHIPS SUMMARY

### One-to-Many (1:N)

| Parent Table | Child Table | Foreign Key | Relationship |
|--------------|-------------|-------------|--------------|
| users | compliance_tasks | ownerId | User owns tasks |
| users | compliance_tasks | reviewerId | User reviews tasks |
| users | evidence_files | uploadedById | User uploads evidence |
| users | csv_import_jobs | uploadedBy | User imports CSV |
| users | audit_logs | userId | User actions logged |
| entities | compliance_tasks | entityId | Entity has tasks |
| departments | compliance_tasks | departmentId | Dept has tasks |
| departments | compliances_master | departmentId | Dept has templates |
| laws | compliance_tasks | lawId | Law has tasks |
| laws | compliances_master | lawId | Law has templates |
| compliances_master | compliance_tasks | complianceMasterId | Template creates tasks |
| compliance_tasks | evidence_files | taskId | Task has evidence |
| csv_import_jobs | csv_import_job_rows | jobId | Job has rows |

---

## 🔐 DATA INTEGRITY CONSTRAINTS

### Primary Keys
- All tables use UUID v4 for primary keys
- Generated via `gen_random_uuid()` PostgreSQL function

### Foreign Keys
- All foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL` based on business logic
- Tasks cascade delete evidence files
- Users set null on task owner/reviewer deletion

### Unique Constraints
- `users.email` - One account per email
- `entities.name` - Unique entity names
- `departments.name` - Unique department names
- `laws.name` - Unique law names
- `compliances_master.name` - Unique template names
- `compliance_tasks(complianceId, entityId)` - One compliance per entity
- `configs.keyName` - Unique config keys

### Check Constraints
- `users.role` IN ('admin', 'reviewer', 'task_owner')
- `compliance_tasks.status` IN ('PENDING', 'COMPLETED', 'SKIPPED')
- `compliances_master.frequency` IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')
- `compliances_master.impact` IN ('HIGH', 'MEDIUM', 'LOW')

---

## 📈 PERFORMANCE OPTIMIZATION

### Critical Indexes

**For Task Queries (Most Common):**
```sql
CREATE INDEX idx_tasks_status ON compliance_tasks(status);
CREATE INDEX idx_tasks_owner ON compliance_tasks(ownerId);
CREATE INDEX idx_tasks_due_date ON compliance_tasks(dueDate);
```

**For Dashboard Queries:**
```sql
CREATE INDEX idx_tasks_owner_status ON compliance_tasks(ownerId, status);
CREATE INDEX idx_tasks_entity_status ON compliance_tasks(entityId, status);
```

**For Audit Queries:**
```sql
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entityType, entityId);
```

**For Search:**
```sql
CREATE INDEX idx_tasks_title ON compliance_tasks USING GIN (to_tsvector('english', title));
CREATE INDEX idx_users_name_email ON users USING GIN (to_tsvector('english', name || ' ' || email));
```

---

## 🗄️ DATABASE SIZE ESTIMATES

**For 1000 tasks/year:**

| Table | Estimated Rows | Size per Row | Total Size |
|-------|----------------|--------------|------------|
| users | 50 | 200 bytes | 10 KB |
| entities | 10 | 150 bytes | 1.5 KB |
| departments | 15 | 150 bytes | 2.3 KB |
| laws | 50 | 300 bytes | 15 KB |
| compliances_master | 100 | 400 bytes | 40 KB |
| compliance_tasks | 1000 | 500 bytes | 500 KB |
| evidence_files | 3000 | 300 bytes | 900 KB |
| audit_logs | 10000 | 400 bytes | 4 MB |
| csv_import_jobs | 50 | 200 bytes | 10 KB |
| csv_import_job_rows | 2000 | 300 bytes | 600 KB |
| report_runs | 52 | 200 bytes | 10 KB |
| configs | 20 | 200 bytes | 4 KB |

**Total:** ~7 MB/year (without indexes)  
**With Indexes:** ~15 MB/year  
**5-year projection:** ~75 MB

**Very lightweight!** Suitable for standard PostgreSQL instances.

---

## 🔄 BACKUP & MAINTENANCE

### Recommended Backup Strategy

**Daily:**
- Full database backup
- Transaction log backup

**Weekly:**
- Backup verification
- Index maintenance

**Monthly:**
- Archive old audit logs (>1 year)
- Analyze table statistics

### Maintenance Queries

```sql
-- Vacuum analyze for performance
VACUUM ANALYZE;

-- Reindex for optimization
REINDEX DATABASE compliance_db;

-- Archive old audit logs (keep 1 year)
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 year';

-- Check table sizes
SELECT 
  schemaname as schema,
  tablename as table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📊 SAMPLE QUERIES

### 1. Get All Pending Tasks for User

```sql
SELECT 
  t.id,
  t.title,
  t.dueDate,
  e.name as entity,
  d.name as department,
  l.name as law
FROM compliance_tasks t
JOIN entities e ON t.entityId = e.id
JOIN departments d ON t.departmentId = d.id
JOIN laws l ON t.lawId = l.id
WHERE t.ownerId = $userId
  AND t.status = 'PENDING'
ORDER BY t.dueDate ASC;
```

### 2. Get Overdue Tasks Count

```sql
SELECT COUNT(*) as overdue_count
FROM compliance_tasks
WHERE status = 'PENDING'
  AND dueDate < CURRENT_DATE;
```

### 3. Get Task with Evidence

```sql
SELECT 
  t.*,
  json_agg(e.*) as evidence
FROM compliance_tasks t
LEFT JOIN evidence_files e ON t.id = e.taskId
WHERE t.id = $taskId
GROUP BY t.id;
```

### 4. Get Department-wise Compliance Stats

```sql
SELECT 
  d.name as department,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN t.status = 'PENDING' AND t.dueDate < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
FROM departments d
LEFT JOIN compliance_tasks t ON d.id = t.departmentId
GROUP BY d.id, d.name
ORDER BY d.name;
```

### 5. Recent Audit Activity

```sql
SELECT 
  al.*,
  u.name as user_name,
  u.email as user_email
FROM audit_logs al
JOIN users u ON al.userId = u.id
ORDER BY al.timestamp DESC
LIMIT 50;
```

---

## ✅ CHECKLIST FOR PRODUCTION

**Before Going Live:**

- [ ] Run `VACUUM ANALYZE` on all tables
- [ ] Verify all indexes created
- [ ] Test foreign key constraints
- [ ] Configure connection pooling (recommend 10-50 connections)
- [ ] Set up automated backups (daily)
- [ ] Configure monitoring (query performance, slow queries)
- [ ] Review and set `shared_buffers` (25% of RAM)
- [ ] Enable query logging for slow queries (> 1s)
- [ ] Set up replication (if high availability needed)
- [ ] Document database credentials securely

---

## 📚 ADDITIONAL NOTES

### Single-Vendor Architecture Benefits

✅ **Simpler Queries** - No workspace filtering needed  
✅ **Better Performance** - Fewer composite indexes  
✅ **Easier Maintenance** - Cleaner schema  
✅ **Global Uniqueness** - Email, names globally unique  
✅ **Reduced Complexity** - One less join in most queries

### Migration from Multi-Tenant (N/A for New Projects)

This is a **new project** with single-vendor architecture from the start. No migration needed.

### Future Enhancements (Optional)

- Full-text search indexes on task title/description
- Materialized views for dashboard stats
- Partitioning for audit_logs (by month/quarter)
- Read replicas for reporting queries

---

**DATABASE DESIGN COMPLETE** ✅

*Ready for production deployment with Supabase or any PostgreSQL 15+ instance.*

---

*ByteLights Private Limited - Compliance Management System*  
*Database Design v2.0 - Single-Vendor Architecture*
