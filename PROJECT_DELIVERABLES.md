**ByteLights Private Limited**

---

# Project Deliverables Document
## Compliance Management System - Phase 1

**Document Version:** 1.0  
**Date:** January 24, 2026  
**Project Duration:** 10 Business Days  

---

## 1. Executive Summary

This document outlines the deliverables for Phase 1 of the Compliance Management System. The system will enable organizations to track regulatory compliance tasks, manage evidence documentation, and maintain audit trails across multiple legal entities and departments.

---

## 2. Project Scope

### 2.1 Included in Phase 1

The following modules and functionality will be delivered within the 10-day timeline:

#### User Management
- Microsoft Single Sign-On integration for authentication
- Role-based access control with three tiers: Admin, Reviewer, and Task Owner
- User profile management and role assignment interface
- Automated user provisioning on first login

#### Master Data Management
- Entity, Department, and Law master data administration
- CRUD operations with workspace-level data segregation
- Data validation and duplicate prevention
- Cascading deletion protection for referenced records

#### Compliance Task Management
- Task creation with entity, department, and law associations
- Task assignment to designated owners
- Task lifecycle management: Pending, Completed, and Skipped states
- Due date tracking and overdue calculation
- Task filtering by status, entity, department, and assigned user
- Search functionality across task attributes
- Pagination support for large datasets

#### Evidence Management
- SharePoint integration for secure file storage
- Multi-file upload capability per task
- Automated folder structure creation per task
- File metadata tracking: uploader, timestamp, file type
- Evidence requirement enforcement for task completion
- Support for large file uploads using chunked transfer

#### CSV Bulk Import
- Bulk task creation via CSV file upload
- Data validation: required field checks, user verification, duplicate detection
- Preview mode for validation before database commit
- Auto-creation of missing master data entries
- Row-level error reporting
- Import job history with success/failure metrics

#### Audit Logging
- Comprehensive activity tracking for all user actions
- Captured events: user role changes, task operations, evidence uploads, data imports
- Filterable audit trail by user, date range, and action type
- Audit log retention for compliance purposes

#### Dashboard and Reporting
- Role-specific dashboard views:
  - Task Owner: personal task statistics, upcoming and overdue tasks
  - Reviewer: department-wise compliance overview, entity-level statistics
  - Admin: system-wide metrics, user activity, import history
- Real-time data visualization
- Quick action links for task management

#### Configuration Management
- SharePoint connection settings interface
- Configuration value encryption for sensitive credentials
- Admin-only access to integration settings
- Connection testing capability

### 2.2 Phase 2 Enhancements (Post Core Delivery)

The following features will be delivered after Phase 1 completion:

**Microsoft Teams Integration (2-3 Days)**
- Automated task notifications to Teams channels
- Weekly compliance report distribution
- Adaptive Card formatting for rich notifications
- Leverages existing Microsoft Graph API infrastructure

**Enhanced Pagination (1-2 Days)**
- Infinite scroll for improved user experience
- Optimized server-side pagination for large datasets
- Configurable page size options

**Report Generation and Export (2-3 Days)**
- Compliance summary reports
- Department-wise analysis
- CSV and Excel export functionality
- Scheduled report generation

**Total Phase 2 Duration: 5-8 Business Days**

### 2.3 Optional Features (Good to Have)

The following features are optional and can be considered after core features are stable:

- Progressive Web App (PWA) support
- PDF export for reports
- Advanced filtering with saved presets
- Custom dashboard widgets
- Evidence file preview within application

### 2.4 Features Not Required

- Multi-workspace switching (single workspace per user is sufficient)
- Custom document version control (SharePoint native versioning will be used)
- Email notifications (Teams integration preferred)
- Mobile application interface

---

## 3. Technical Specifications

### 3.1 Architecture

**Frontend:**
- Framework: Angular 21 (aligned with development guidelines)
- Package Manager: PNPM with NX workspace
- UI Components: Angular Material Design
- Authentication: Microsoft Authentication Library (MSAL)
- State Management: RxJS Observables with service-based architecture
- Module Loading: Lazy loading for optimized bundle size
- Component Structure: Separate HTML/CSS files following naming conventions

**Backend:**
- Framework: NestJS 11
- Runtime: Node.js 20.19.0
- Language: TypeScript with strict typing
- Database: PostgreSQL with Prisma ORM
- Authentication: Passport JWT with Microsoft OAuth2
- Authorization: Role-based guards with permission validation
- External APIs: Microsoft Graph API for SharePoint integration
- API Structure: RESTful endpoints with standardized naming (api/[module]/[resource])

**Infrastructure:**
- Monorepo: PNPM workspace with apps and shared packages
- Database: PostgreSQL (Supabase-hosted)
- File Storage: SharePoint document library
- Session Management: HTTP-only secure cookies with session storage
- Version Control: Git with branch-based deployment strategy

### 3.2 Security Implementation

**Authentication and Authorization:**
- OAuth 2.0 authorization code flow for user authentication
- JWT-based session management with 7-day token expiration
- Frontend: AuthenticationGuard and PermissionGuard on all protected routes
- Backend: AuthMiddleware with @CurrentUser decorator and role-based guards
- Role-based access control enforced at both frontend and backend layers

**Security Best Practices:**
- AES-256-CBC encryption for stored credentials
- HTTP-only cookies to prevent XSS attacks
- Input validation and sanitization on all API requests
- Parameterized database queries to prevent SQL injection
- Session storage for sensitive data (no local storage)
- CORS configuration with whitelisted origins
- No direct DOM manipulation in frontend code

### 3.3 Code Quality Standards

**Coding Guidelines:**
- TypeScript strict mode with explicit type declarations
- Avoidance of "any" type unless documented
- Consistent naming: camelCase for variables, PascalCase for classes/interfaces
- File naming: lowercase with hyphens (feature.type.ts)
- Code formatting: 2-space indentation via Prettier
- File size limit: 400 lines maximum
- Function size limit: 75 lines maximum
- Comprehensive JSDoc comments for all methods

**Testing and Quality Assurance:**
- Unit test coverage target: 80% minimum
- Linting: ESLint with TypeScript plugin
- Code review: Mandatory PR review before merge
- No unused code or commented code in repository

### 3.4 Performance and Accessibility

**Performance Targets:**
- Largest Contentful Paint (LCP): ≤ 2.5 seconds
- First Input Delay (FID): ≤ 100 milliseconds
- Cumulative Layout Shift (CLS): ≤ 0.1
- Bundle size budgets: Warning at 500KB, Error at 1MB
- Server-side pagination for datasets exceeding 100 records
- Default page size: 20 items (configurable to 5, 10, 20, 50, 100)

**Browser Compatibility:**
- Google Chrome (latest 2 versions)
- Microsoft Edge (latest 2 versions)
- Safari for macOS and iPad (latest 2 versions)
- Mobile web view support

**Accessibility Compliance:**
- WCAG 2.0 Level AA compliance
- Alt text and ARIA labels for all images and graphical content
- Accurate labels for all form fields
- Managed tab index per design guidelines
- Usable with mouse, keyboard, stylus, and touch

### 3.5 Data Model

Core entities include:
- User: authentication and authorization data
- Workspace: tenant-level data segregation
- Entity: legal entities subject to compliance requirements
- Department: organizational units within entities
- Law: regulatory requirements and compliance laws
- ComplianceMaster: master compliance task definitions
- ComplianceTask: individual task instances assigned to users
- EvidenceFile: metadata for uploaded supporting documents
- CsvImportJob: bulk import operation tracking
- AuditLog: system activity tracking

**Database Naming Conventions:**
- Table names: plural, lowercase with hyphens
- Column names: lowercase with underscores
- Indexes and constraints follow standard naming patterns

---

## 4. Delivery Timeline

### Phase 1: Core System Development (10 Business Days)

**Days 1-3: Foundation and Authentication**
- Monorepo setup with PNPM workspace and NX
- Database schema design and Prisma migrations
- Microsoft SSO integration with MSAL
- User management module with role-based access
- Authentication guards and middleware (frontend and backend)
- Initial linting and formatting configuration
- Unit test setup and configuration

**Days 4-6: Core Business Logic**
- Master data management interface with CRUD operations
- Compliance task creation, assignment, and lifecycle management
- CSV bulk import with validation and preview
- Evidence upload integration with SharePoint via Microsoft Graph API
- Service layer architecture with proper separation of concerns
- API endpoint implementation with guards and validation
- Unit tests for services and controllers

**Days 7-8: Dashboard and Reporting**
- Role-based dashboard components (Admin, Reviewer, Task Owner)
- Task filtering, search, and pagination
- Audit log viewer with filtering capabilities
- Configuration management interface for integrations
- Responsive UI with Angular Material components
- Frontend guards for route protection
- Integration testing for end-to-end flows

**Days 9-10: Testing, Quality Assurance, and Deployment**
- Code review and quality gate validation
- Linting and formatting verification
- Unit test coverage validation (80% target)
- Performance benchmarking (LCP, FID, CLS)
- Browser compatibility testing
- Security audit and vulnerability scanning
- Integration testing across all modules
- User acceptance testing support
- Production deployment with environment configuration
- Documentation and knowledge transfer session

**Development Practices Throughout:**
- Daily commits to feature branches
- Pull request reviews before merging to development branch
- Continuous integration with automated testing
- Adherence to coding standards and naming conventions
- Regular sync with client stakeholders

---

## 5. System Requirements

### 5.1 Development Environment

**Required Software:**
- Node.js version 20.19.0 (managed via nvm recommended)
- PNPM package manager (latest version)
- NX CLI installed globally
- PostgreSQL database (local or Supabase)
- Git for version control

**Recommended IDEs:**
- Visual Studio Code
- JetBrains WebStorm
- Cursor

**Required Extensions/Tools:**
- Prettier Code Formatter
- Angular Language Service
- ESLint
- Code Spell Checker

### 5.2 Client-Side Prerequisites

- Microsoft 365 tenant with active subscription
- Azure Active Directory access for app registration
- Azure AD permissions: User.Read, Sites.ReadWrite.All
- SharePoint site with document library for evidence storage
- PostgreSQL database instance (Supabase recommended for Phase 1)
- Domain for application hosting with SSL certificate

### 5.3 User Access Requirements

- Valid Microsoft 365 account for each system user
- Modern web browser as per compatibility standards:
  - Google Chrome (latest 2 versions)
  - Microsoft Edge (latest 2 versions)
  - Safari for macOS/iPad (latest 2 versions)
- Network access to application domain and Microsoft services
- JavaScript enabled in browser
- Cookies enabled for session management

---

## 6. Development Standards Compliance

This project adheres to the Software Development Guidelines provided by the client organization. Key compliance areas include:

**Code Organization:**
- PNPM workspace with NX monorepo structure
- Shared libraries for cross-application code
- Consistent file and folder naming conventions
- Separation of concerns with service-based architecture

**Development Practices:**
- Git flow with protected branches (dev, qa, master)
- Pull request-based code review process
- Branch naming: <ID>-<brief-description>
- Commit messages: <JIRA_ID>::<description>::<changes>

**Quality Enforcement:**
- ESLint rules enforced in pre-commit hooks
- Prettier formatting for code consistency
- TypeScript strict mode with comprehensive type checking
- Mandatory peer review before branch merges

**Authorization Framework:**
- Frontend guards: AuthenticationGuard and PermissionGuard
- Backend guards: AuthMiddleware with permission decorators
- @CurrentUser decorator for accessing session user in controllers
- Centralized permission management

**Logging and Monitoring:**
- Backend: NestJS Logger with info, warn, and error levels
- Frontend: LoggerService injected via dependency injection
- Structured logging for debugging and analytics
- Application behavior tracking per guidelines

**API Standards:**
- RESTful endpoint design with resource-based URLs
- Lowercase with hyphens for improved readability
- Consistent HTTP methods: GET, POST, PUT, DELETE
- Error responses with appropriate HTTP status codes

## 7. Post-Delivery Support

### 7.1 Handover Items

- Complete source code repository with Git history
- Database schema with Prisma migration scripts
- Environment configuration guide (.env.example files)
- API documentation with all endpoint specifications
- Component documentation and architecture diagrams
- User manual for administrators, reviewers, and task owners
- Deployment procedures and infrastructure requirements
- Code review checklist aligned with development guidelines

### 7.2 Configuration Assistance

- Azure AD application registration with required API permissions
- SharePoint site setup and document library configuration
- Database connection configuration (Supabase or self-hosted)
- Initial admin user creation and role assignment
- Sample CSV import template with validation rules
- Development environment setup guide
- CI/CD pipeline configuration recommendations

### 7.3 Knowledge Transfer

- Walkthrough of monorepo structure and shared libraries
- Overview of authentication and authorization flow
- Explanation of key architectural decisions
- Best practices for extending functionality
- Troubleshooting common issues
- Performance optimization guidelines

---

## 8. Assumptions and Dependencies

### 8.1 Assumptions

- Client has administrative access to Microsoft 365 tenant
- SharePoint site and document library exist or can be created
- Database infrastructure is provisioned before development begins
- Client provides test user accounts for UAT
- Compliance task definitions and master data will be provided by client

### 8.2 Dependencies

- Timely access to client's Azure AD for app registration
- SharePoint API permissions approval from Microsoft 365 admin
- Availability of client stakeholders for requirement clarification
- Test environment availability for integration validation

---

## 9. Success Criteria

Phase 1 will be considered complete when the following criteria are met:

**Functional Completeness:**
- All users can authenticate using Microsoft credentials via MSAL
- Admins can create and manage master data (entities, departments, laws)
- Task owners can view assigned tasks, upload evidence to SharePoint, and complete tasks
- Reviewers can monitor compliance status across departments and entities
- CSV bulk import successfully creates tasks with validation and error reporting
- Audit logs capture all system activities with filtering capabilities
- Dashboard displays accurate real-time statistics based on user roles
- All API endpoints are secured with role-based authorization guards

**Quality Standards:**
- Code passes all linting rules without warnings
- Unit test coverage meets or exceeds 80% threshold
- All code reviewed and approved via pull request process
- No unused code or commented code in repository
- Follows TypeScript strict typing with minimal use of "any"
- Adheres to file size limits (400 lines) and function size limits (75 lines)

**Performance Benchmarks:**
- Largest Contentful Paint (LCP) under 2.5 seconds
- First Input Delay (FID) under 100 milliseconds
- Cumulative Layout Shift (CLS) under 0.1
- Bundle size within configured budgets (500KB warning, 1MB error)
- Server-side pagination implemented for large datasets

**Security Validation:**
- All routes protected with appropriate guards
- Input validation on all API endpoints
- Session management via HTTP-only cookies
- No security vulnerabilities in npm audit report
- CORS configured with whitelisted origins only

**Browser Compatibility:**
- Application tested and functional on Chrome (latest 2 versions)
- Application tested and functional on Edge (latest 2 versions)
- Application tested and functional on Safari for macOS (latest 2 versions)

**Deployment Readiness:**
- System deployed to test environment successfully
- Environment configuration documented
- Database migrations execute without errors
- Integration testing scenarios pass
- User acceptance testing completed with stakeholder sign-off

---

## 10. Known Limitations

**Phase 1 Constraints:**
- SharePoint file upload limited to 250MB per chunk (per chunked transfer protocol)
- CSV import processes synchronously; files with over 1000 rows may require processing time
- Audit logs track record-level operations, not field-level changes
- Dashboard statistics calculate on demand; response caching not implemented
- Single workspace per user session; multi-workspace switching requires enhancement

**Progressive Web App Features:**
- PWA support not included in Phase 1 (installability and offline page)
- Service worker for resource caching not implemented
- Background sync for offline operations not available

**Advanced Features:**
- Client-side pagination only; server-side pagination threshold at 100 records
- Infinite scroll not implemented for list views in Phase 1
- Real-time notifications require Teams integration (Phase 2)
- Advanced filtering with saved presets not available
- Report export functionality (PDF/Excel) not included

**Third-Party Dependencies:**
- Application requires active internet connection for Microsoft authentication
- SharePoint API rate limits apply to file operations
- Microsoft Graph API throttling may affect bulk operations

---

## 11. Phase 2 Implementation Plan

### Microsoft Teams Integration (2-3 Days)

Teams integration leverages the existing Microsoft Graph API infrastructure already implemented for SharePoint integration, making this a straightforward enhancement.

**Day 1: Configuration and Setup**
- Teams webhook configuration interface in admin panel
- Webhook URL encryption and storage
- Connection testing functionality
- Reuse existing Microsoft Graph API authentication flow

**Day 2: Notification Service**
- Task assignment notifications to Teams channels
- Task due date reminder notifications
- Task completion alerts
- Adaptive Card formatting for rich message display

**Day 3: Weekly Reports**
- Scheduled cron job for weekly report generation
- Department-wise compliance statistics
- Overdue task summaries
- Automated posting to configured Teams channels
- Testing and deployment

**Technical Advantage:** Since MSAL authentication and Microsoft Graph API are already operational for SharePoint, Teams integration requires only webhook configuration and notification service implementation.

### Enhanced Pagination (1-2 Days)

**Day 1: Backend Implementation**
- Server-side cursor-based pagination
- Database query optimization with proper indexing
- Pagination metadata in API responses

**Day 2: Frontend Enhancement**
- Infinite scroll implementation for task lists
- Smooth loading experience
- Performance testing with large datasets

### Report Generation and Export (2-3 Days)

**Day 1-2: Report Builder**
- Compliance summary reports
- Department-wise compliance analysis
- Task completion reports with date ranges
- Overdue task reports by entity and department

**Day 3: Export Functionality**
- CSV export for all report types
- Excel export with proper formatting
- Report scheduling and automation

**Total Phase 2 Duration: 5-8 Business Days**

---

## 12. Optional Features (Good to Have)

The following features are optional enhancements that can be implemented after core features are delivered and stabilized:

**Progressive Web App Support (3-4 Days)**
- Offline page implementation
- Service worker for resource caching
- App installability on mobile devices

**PDF Report Export (2-3 Days)**
- PDF generation for compliance reports
- Custom branding and formatting
- Downloadable compliance certificates

**Advanced Filtering (2-3 Days)**
- Saved filter presets
- Custom dashboard widgets
- User-specific view preferences

**Additional Enhancements**
- Task recurrence patterns for periodic compliance requirements
- Batch task assignment to multiple users
- Evidence file preview within application
- Real-time notifications via WebSocket
- Advanced analytics with predictive insights
- Background processing for large CSV imports

---

## 13. Features Not Required

Based on client requirements and system design principles:

**Multi-Workspace Switching**
- Current single workspace per user architecture is sufficient
- Users requiring multiple organization access will use separate logins
- Maintains system simplicity and data isolation

**Custom Document Version Control**
- SharePoint's native version control capabilities will be utilized
- No custom implementation required
- Reduces development complexity and maintenance overhead

**Email Notifications**
- Microsoft Teams integration preferred for notifications
- Better integration with organizational collaboration tools
- Richer notification experience through Adaptive Cards

---

**Document Prepared By:** ByteLights Development Team  
**Review Status:** Approved for Client Submission  

---

*This document represents the binding scope of work for Phase 1 delivery. Any modifications to scope, timeline, or deliverables require formal change request approval.*
