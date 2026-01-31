# Database Tables - One-Line Descriptions

**For Email/Quick Reference**

---

## 📊 **12 Tables - One-Liner Roles**

1. **users** - Stores user accounts with role-based access control (admin, reviewer, task_owner) and Microsoft SSO integration

2. **entities** - Master data for organizational locations/branches where compliance tasks are performed (e.g., Mumbai Office, Delhi Branch)

3. **departments** - Master data for departments responsible for compliance activities (e.g., Legal, Finance, HR)

4. **laws** - Master repository of regulatory laws and regulations requiring compliance (e.g., Companies Act 2013, GST Act)

5. **compliances_master** - Template library for standard recurring compliance requirements, used to create tasks efficiently and maintain consistency

6. **compliance_tasks** - Main business table tracking all compliance tasks with lifecycle management (PENDING → COMPLETED/SKIPPED), evidence linking, and overdue monitoring

7. **evidence_files** - Stores metadata for compliance evidence files uploaded to SharePoint (files stored in SharePoint, metadata in DB)

8. **csv_import_jobs** - Tracks bulk CSV import operations with validation results (preview/commit modes) for efficient task creation

9. **csv_import_job_rows** - Stores per-row validation results from CSV imports with error messages for failed rows

10. **audit_logs** - Comprehensive audit trail recording all user actions for security, compliance reporting, and forensic investigation

11. **report_runs** - Tracks automated weekly compliance report generation and Teams delivery with success/failure status

12. **configs** - Centralized key-value store for system configuration (SharePoint settings, Teams webhook, report scheduling)

---

## 📧 **EMAIL-READY FORMAT**

Copy this for your email:

---

**Database Schema - 12 Tables Overview:**

• **users** - User accounts with RBAC (admin/reviewer/task_owner) and Microsoft SSO  
• **entities** - Organizational locations (Mumbai Office, Delhi Branch, etc.)  
• **departments** - Responsible departments (Legal, Finance, HR, etc.)  
• **laws** - Regulatory framework (Companies Act, GST Act, etc.)  
• **compliances_master** - Reusable task templates for standardization  
• **compliance_tasks** - Core business table tracking all compliance activities  
• **evidence_files** - SharePoint file metadata for compliance proof  
• **csv_import_jobs** - Bulk import tracking with validation  
• **csv_import_job_rows** - Per-row validation results  
• **audit_logs** - Complete audit trail for security & compliance  
• **report_runs** - Weekly report generation & Teams delivery tracking  
• **configs** - System configuration (SharePoint, Teams, scheduling)  

**Total: 12 tables supporting single-vendor compliance management**

---

## 🎯 **ULTRA-SHORT VERSION** (One sentence per group)

Copy this for super brief email:

---

**Database: 12 Tables in 4 Groups**

1. **Master Data (4):** users, entities, departments, laws - foundational reference data
2. **Compliance Core (3):** compliances_master (templates), compliance_tasks (main tracking), evidence_files (proof)
3. **Bulk Operations (2):** csv_import_jobs, csv_import_job_rows - mass task creation
4. **Audit & Config (3):** audit_logs (security trail), report_runs (Teams reports), configs (settings)

---

## 💼 **BUSINESS-FRIENDLY VERSION**

Copy this for non-technical stakeholders:

---

**Our Compliance System Database:**

**Core Operations:**
• Tracks compliance tasks from creation to completion
• Manages users with different access levels
• Stores evidence files in SharePoint
• Maintains complete audit history

**Efficiency Features:**
• Template library for recurring tasks
• Bulk CSV import for mass task creation
• Automated weekly Teams reports

**Foundation:**
• Master data for entities, departments, and laws
• System configuration management

**Result:** Comprehensive compliance tracking with full audit trail and automation

---

## 📋 **TABLE + PURPOSE FORMAT**

Copy this for technical documentation:

---

| Table | Purpose |
|-------|---------|
| users | User authentication and RBAC |
| entities | Organizational locations |
| departments | Responsible departments |
| laws | Regulatory framework |
| compliances_master | Task templates |
| compliance_tasks | Main task tracking |
| evidence_files | SharePoint file metadata |
| csv_import_jobs | Bulk import tracking |
| csv_import_job_rows | Import validation details |
| audit_logs | Security audit trail |
| report_runs | Teams report tracking |
| configs | System configuration |

---

## 🚀 **FEATURES-FOCUSED VERSION**

Copy this to highlight capabilities:

---

**Database Powers These Features:**

✅ **User Management** - Role-based access with Microsoft SSO (users table)  
✅ **Task Management** - Complete lifecycle tracking (compliance_tasks)  
✅ **Evidence Storage** - SharePoint integration (evidence_files)  
✅ **Bulk Operations** - CSV import for 100+ tasks (csv_import_jobs)  
✅ **Templates** - Reusable compliance definitions (compliances_master)  
✅ **Audit Trail** - Full compliance history (audit_logs)  
✅ **Automation** - Weekly Teams reports (report_runs)  
✅ **Master Data** - Entities, departments, laws reference tables  
✅ **Configuration** - Centralized settings (configs)  

---

**Choose the format that best fits your email context!** ✉️
