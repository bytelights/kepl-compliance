# Compliance Management System - Implementation Tasks

## 1. Project Setup and Infrastructure

- [ ] 1.1 Initialize monorepo structure with PNPM workspaces
  - Create root package.json with workspace configuration
  - Set up apps/frontend-angular and apps/backend-nest directories
  - Create packages/shared-types directory
  - Configure pnpm-workspace.yaml
  - Add .env.example files

- [ ] 1.2 Initialize NestJS backend application
  - Generate NestJS project in apps/backend-nest
  - Configure TypeScript strict mode
  - Set up Prisma with PostgreSQL
  - Configure environment variables
  - Add necessary dependencies (Prisma, MSAL, @nestjs/schedule, etc.)

- [ ] 1.3 Initialize Angular frontend application
  - Generate Angular project in apps/frontend-angular
  - Configure TypeScript strict mode
  - Add Angular Material
  - Add MSAL Angular library
  - Configure routing and base layout

- [ ] 1.4 Set up shared types package
  - Create package structure
  - Configure TypeScript compilation
  - Export common types and enums
  - Link to frontend and backend

## 2. Database Schema and Migrations

- [ ] 2.1 Create Prisma schema for core tables
  - Define workspaces table
  - Define users table with role enum
  - Define entities, departments, laws, compliances_master tables
  - Add workspace_id to all tables
  - Configure indexes and constraints

- [ ] 2.2 Create Prisma schema for compliance tasks
  - Define compliance_tasks table
  - Add owner_id and reviewer_id as single FKs
  - Add unique constraint (workspace_id, compliance_id, entity_id)
  - Define task_execution table
  - Define evidence_files table

- [ ] 2.3 Create Prisma schema for system tables
  - Define audit_logs table (immutable)
  - Define csv_import_jobs and csv_import_job_rows tables
  - Define report_runs table
  - Define configs table with encryption support

- [ ] 2.4 Generate and test initial migration
  - Run prisma migrate dev
  - Verify schema in database
  - Create seed script for initial workspace and admin user

## 3. Authentication and Authorization

- [ ] 3.1 Implement Microsoft SSO backend flow
  - Create AuthModule with MSAL configuration
  - Implement GET /auth/microsoft/login endpoint
  - Implement GET /auth/microsoft/callback endpoint
  - Generate JWT and set httpOnly cookie
  - Handle user creation/update on login

- [ ] 3.2 Implement session management
  - Create JWT strategy and guard
  - Implement GET /auth/me endpoint
  - Implement POST /auth/logout endpoint
  - Add cookie security configuration (httpOnly, secure, sameSite)

- [ ] 3.3 Implement RBAC guards and decorators
  - Create @Roles decorator
  - Create RolesGuard for endpoint protection
  - Add role checking logic (admin/reviewer/task_owner)
  - Test guard with different roles

- [ ] 3.4 Implement user management endpoints
  - Create UsersModule
  - Implement GET /users (admin only)
  - Implement PATCH /users/:id/role (admin only)
  - Add DTO validation for role updates

- [ ] 3.5 Implement frontend authentication
  - Configure MSAL in Angular
  - Create auth service
  - Implement login redirect
  - Handle OAuth callback
  - Store and manage session
  - Create auth guard for routes

- [ ] 3.6 Create role-based navigation
  - Implement navigation based on user role
  - Show/hide menu items per role
  - Create route guards for role-specific pages

## 4. Master Data Management

- [ ] 4.1 Implement master data backend module
  - Create MasterDataModule
  - Implement generic CRUD service for master data
  - Add workspace filtering
  - Implement unique constraint validation per workspace

- [ ] 4.2 Implement master data endpoints
  - GET /master/entities, /master/departments, /master/laws, /master/compliances_master
  - POST endpoints (admin only)
  - PATCH endpoints (admin only)
  - DELETE endpoints (admin only with in-use validation)

- [ ] 4.3 Create master data frontend components
  - Create master data list components (entities, departments, laws, compliances)
  - Create add/edit dialogs
  - Add delete confirmation
  - Implement admin-only access

- [ ] 4.4 Implement master data dropdowns
  - Create reusable dropdown components
  - Load master data on component init
  - Add to task create/edit forms

## 5. Compliance Task Management

- [ ] 5.1 Implement tasks backend module
  - Create TasksModule
  - Implement task CRUD service
  - Add workspace and role-based filtering
  - Implement single owner_id and reviewer_id validation

- [ ] 5.2 Implement task list endpoints
  - GET /tasks with filters, search, pagination
  - Implement RBAC: admin/reviewer see all, owner sees assigned only
  - Add query parameters for entity, department, law, status, date range, etc.
  - Implement search on title, compliance_id, entity, law

- [ ] 5.3 Implement task CRUD endpoints
  - POST /tasks (admin/reviewer only)
  - GET /tasks/:id
  - PATCH /tasks/:id (admin/reviewer only, not execution fields)
  - DELETE /tasks/:id (admin only)
  - Validate single assignee and reviewer

- [ ] 5.4 Create task list frontend component
  - Create task list with filters
  - Implement search functionality
  - Add pagination
  - Show different views based on role (all tasks vs my tasks)

- [ ] 5.5 Create task detail frontend component
  - Display task information
  - Show evidence files
  - Show execution history
  - Add role-based action buttons

- [ ] 5.6 Create task create/edit forms
  - Create form with all task fields
  - Add master data dropdowns
  - Add owner and reviewer dropdowns (users only)
  - Validate single assignee and reviewer
  - Implement admin/reviewer only access

## 6. SharePoint Evidence Management

- [ ] 6.1 Implement SharePoint integration service
  - Create IntegrationsModule
  - Implement Graph API client
  - Add authentication with app credentials
  - Implement folder creation logic
  - Implement path generation: Compliance-Documents/{Entity}/{Year}/{Month}/{Compliance_ID}/

- [ ] 6.2 Implement evidence upload endpoints
  - POST /tasks/:id/evidence/upload-session
  - Create upload session via Graph API
  - Return uploadUrl and session details
  - POST /tasks/:id/evidence/complete
  - Store metadata in evidence_files table
  - Implement idempotency check

- [ ] 6.3 Implement evidence management endpoints
  - GET /tasks/:id/evidence
  - DELETE /evidence/:id with role-based rules
  - Admin can delete any, owner can delete if task PENDING and owns evidence

- [ ] 6.4 Create evidence upload frontend component
  - Create drag-and-drop file upload
  - Implement chunk upload to Graph API
  - Show progress indicators per file
  - Add retry capability
  - Display uploaded evidence list

- [ ] 6.5 Implement SharePoint configuration
  - PUT /integrations/sharepoint (admin only)
  - POST /integrations/sharepoint/test (admin only)
  - Store config in configs table with encryption
  - Create admin UI for SharePoint configuration

## 7. Task Execution Workflow

- [ ] 7.1 Implement task execution backend endpoints
  - POST /tasks/:id/execute/complete (task_owner only)
  - Validate comment and evidence existence
  - Create task_execution row
  - Update task status to COMPLETED
  - Write audit log
  - Use transaction for atomicity

- [ ] 7.2 Implement task skip backend endpoint
  - POST /tasks/:id/execute/skip (task_owner only)
  - Validate remarks field
  - Create task_execution row
  - Update task status to SKIPPED
  - Write audit log
  - Use transaction for atomicity

- [ ] 7.3 Create complete task modal
  - Create modal component
  - Add comment field (required)
  - Add file upload section (required, at least 1 file)
  - Enable submit only when requirements met
  - Call complete endpoint

- [ ] 7.4 Create skip task modal
  - Create modal component
  - Add skip reason field (required)
  - Call skip endpoint

- [ ] 7.5 Implement task execution history view
  - Display execution records
  - Show comments, remarks, timestamps
  - Link to evidence files

## 8. CSV Bulk Import

- [ ] 8.1 Implement CSV parsing service
  - Create ImportModule
  - Implement CSV parser
  - Validate required columns
  - Map CSV columns to task fields

- [ ] 8.2 Implement CSV validation logic
  - Validate required fields
  - Check owner/reviewer existence (email/name match)
  - Auto-create entities, departments, laws
  - Detect duplicates: unique(workspace_id, compliance_id, entity_id)
  - Collect row-level errors

- [ ] 8.3 Implement CSV import endpoints
  - POST /admin/import/csv?mode=preview|commit
  - Preview mode: validate without saving
  - Commit mode: save to database
  - Store job in csv_import_jobs
  - Store row results in csv_import_job_rows

- [ ] 8.4 Implement import job management endpoints
  - GET /admin/import/jobs
  - GET /admin/import/jobs/:id
  - GET /admin/import/jobs/:id/errors (JSON/CSV download)

- [ ] 8.5 Create CSV import frontend component
  - Create file upload for CSV
  - Show preview results
  - Display validation errors
  - Commit button after successful preview
  - Show import job history
  - Download errors functionality

## 9. Audit Logging

- [ ] 9.1 Implement audit logging service
  - Create AuditModule
  - Implement audit log creation
  - Add request ID tracking
  - Store before/after changes
  - Make logs immutable (no update/delete)

- [ ] 9.2 Integrate audit logging across modules
  - Log role changes
  - Log master data changes
  - Log CSV imports
  - Log task lifecycle changes
  - Log evidence uploads
  - Log task execution
  - Log configuration changes

- [ ] 9.3 Implement audit log endpoints
  - GET /audit-logs with filters and pagination
  - Restrict access to admin and reviewer only

- [ ] 9.4 Create audit logs viewer frontend
  - Create audit logs list component
  - Add filters (user, action, date range, entity type)
  - Display changes (before/after)
  - Implement admin/reviewer only access

## 10. Teams Weekly Report

- [ ] 10.1 Implement Teams webhook service
  - Create ReportsModule
  - Implement Teams webhook client
  - Create Adaptive Card formatter
  - Implement report content generation

- [ ] 10.2 Implement weekly report scheduler
  - Use @nestjs/schedule
  - Read schedule config from configs table
  - Generate report with summary counts and task table
  - Post to Teams webhook
  - Store execution in report_runs table
  - Implement deduplication per period

- [ ] 10.3 Implement Teams configuration endpoints
  - PUT /integrations/teams (admin only)
  - POST /integrations/teams/test (admin only)
  - Store webhook URL and schedule in configs table

- [ ] 10.4 Create Teams configuration frontend
  - Create Teams config form
  - Add webhook URL field
  - Add schedule configuration (day, time, timezone)
  - Add test webhook button
  - Implement admin only access

## 11. Dashboards

- [ ] 11.1 Implement dashboard backend endpoints
  - GET /dashboard/task-owner (my stats)
  - GET /dashboard/reviewer (entity/department stats)
  - GET /dashboard/admin (system overview)
  - Implement role-based data filtering

- [ ] 11.2 Create Task Owner Dashboard
  - Display my pending count
  - Display due this week count
  - Display overdue count
  - Add calendar view of tasks
  - Add quick action buttons

- [ ] 11.3 Create Reviewer Dashboard
  - Display entity-wise compliance health
  - Display department-wise statistics
  - Show overdue list
  - Link to audit logs

- [ ] 11.4 Create Admin Dashboard
  - Display import history
  - Display compliance health overview
  - Display user activity
  - Link to audit logs
  - Link to master data management
  - Link to integrations management

## 12. Configuration Management

- [ ] 12.1 Implement configuration service
  - Create ConfigModule
  - Implement config CRUD with encryption
  - Add encryption for sensitive values
  - Implement config caching

- [ ] 12.2 Implement configuration endpoints
  - GET /configs/:key (admin only)
  - PUT /configs/:key (admin only)
  - Validate configuration keys

- [ ] 12.3 Create configuration frontend components
  - Create system configuration page
  - Add forms for each config type
  - Implement admin only access

## 13. Error Handling and Logging

- [ ] 13.1 Implement global exception filter
  - Create custom exception filter
  - Format error responses consistently
  - Log errors with request ID
  - Handle validation errors

- [ ] 13.2 Implement structured logging
  - Configure logger with request ID
  - Add logging to all modules
  - Log API requests and responses
  - Log external API calls

- [ ] 13.3 Implement frontend error handling
  - Create global error handler
  - Display user-friendly error messages
  - Add error notification service
  - Handle authentication errors

## 14. Testing and Quality Assurance

- [ ] 14.1 Write backend unit tests
  - Test authentication flow
  - Test RBAC guards
  - Test task CRUD operations
  - Test CSV import validation
  - Test audit logging

- [ ] 14.2 Write backend integration tests
  - Test complete task flow
  - Test skip task flow
  - Test CSV import end-to-end
  - Test SharePoint integration
  - Test Teams webhook

- [ ] 14.3 Write frontend unit tests
  - Test authentication service
  - Test task components
  - Test form validations
  - Test role-based rendering

- [ ] 14.4 Perform end-to-end testing
  - Test complete user workflows
  - Test role-based access control
  - Test file uploads
  - Test CSV import
  - Test Teams reporting

## 15. Documentation and Deployment

- [ ] 15.1 Create setup documentation
  - Document Supabase setup
  - Document Microsoft Entra ID app registration
  - Document SharePoint configuration
  - Document Teams webhook setup
  - Document environment variables
  - Document local development setup

- [ ] 15.2 Create deployment scripts
  - Add build scripts for frontend and backend
  - Add migration scripts
  - Add seed scripts
  - Configure production environment variables

- [ ] 15.3 Create user documentation
  - Document admin workflows
  - Document reviewer workflows
  - Document task owner workflows
  - Create troubleshooting guide

- [ ] 15.4 Final code review and cleanup
  - Remove placeholder code
  - Ensure consistent formatting
  - Verify all validation rules
  - Check error handling
  - Verify transaction usage
  - Test idempotency
