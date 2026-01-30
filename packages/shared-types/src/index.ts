// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  REVIEWER = 'reviewer',
  TASK_OWNER = 'task_owner',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export enum TaskFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
  ONE_TIME = 'ONE_TIME',
}

export enum TaskImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ImportStatus {
  PREVIEW = 'PREVIEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  role: UserRole;
  msOid?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
}

// ============================================================================
// MASTER DATA TYPES
// ============================================================================

export interface Entity {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Law {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceMaster {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// COMPLIANCE TASK TYPES
// ============================================================================

export interface ComplianceTask {
  id: string;
  workspaceId: string;
  complianceId: string;
  title: string;
  description?: string;
  lawId: string;
  departmentId: string;
  entityId: string;
  complianceMasterId?: string;
  ownerId: string;
  reviewerId: string;
  status: TaskStatus;
  frequency?: TaskFrequency;
  impact?: TaskImpact;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Populated relations
  law?: Law;
  department?: Department;
  entity?: Entity;
  complianceMaster?: ComplianceMaster;
  owner?: User;
  reviewer?: User;
  evidenceCount?: number;
  isOverdue?: boolean;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  comment?: string;
  remarks?: string;
  executedAt: Date;
}

// ============================================================================
// EVIDENCE FILE TYPES
// ============================================================================

export interface EvidenceFile {
  id: string;
  workspaceId: string;
  taskId: string;
  uploadedBy: string;
  itemId: string;
  webUrl: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  siteId: string;
  driveId: string;
  path: string;
  uploadedAt: Date;
}

// ============================================================================
// CSV IMPORT TYPES
// ============================================================================

export interface CsvImportJob {
  id: string;
  workspaceId: string;
  uploadedBy: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: ImportStatus;
  mode: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CsvImportJobRow {
  id: string;
  jobId: string;
  rowNumber: number;
  success: boolean;
  errorMsg?: string;
  rowData: any;
  createdAt: Date;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  requestId?: string;
  timestamp: Date;
  user?: User;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ReportRun {
  id: string;
  workspaceId: string;
  reportType: string;
  executedAt: Date;
  success: boolean;
  errorMsg?: string;
  periodStart: Date;
  periodEnd: Date;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface Config {
  id: string;
  workspaceId: string;
  keyName: string;
  value: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// DTOs - AUTHENTICATION
// ============================================================================

export interface LoginResponse {
  user: CurrentUser;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

// ============================================================================
// DTOs - MASTER DATA
// ============================================================================

export interface CreateMasterDataDto {
  name: string;
}

export interface UpdateMasterDataDto {
  name: string;
}

// ============================================================================
// DTOs - COMPLIANCE TASKS
// ============================================================================

export interface CreateComplianceTaskDto {
  complianceId: string;
  title: string;
  description?: string;
  lawId: string;
  departmentId: string;
  entityId: string;
  complianceMasterId?: string;
  ownerId: string;
  reviewerId: string;
  frequency?: TaskFrequency;
  impact?: TaskImpact;
  dueDate?: Date;
}

export interface UpdateComplianceTaskDto {
  title?: string;
  description?: string;
  lawId?: string;
  departmentId?: string;
  entityId?: string;
  complianceMasterId?: string;
  ownerId?: string;
  reviewerId?: string;
  frequency?: TaskFrequency;
  impact?: TaskImpact;
  dueDate?: Date;
}

export interface CompleteTaskDto {
  comment: string;
}

export interface SkipTaskDto {
  remarks: string;
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  entityId?: string;
  departmentId?: string;
  lawId?: string;
  status?: TaskStatus;
  ownerId?: string;
  reviewerId?: string;
  complianceId?: string;
  impact?: TaskImpact;
  frequency?: TaskFrequency;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

// ============================================================================
// DTOs - EVIDENCE
// ============================================================================

export interface CreateUploadSessionDto {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadSessionResponse {
  uploadSessionId: string;
  uploadUrl: string;
  expiresAt: string;
  chunkSizeBytes: number;
  siteId: string;
  driveId: string;
  targetPath: string;
}

export interface CompleteUploadDto {
  uploadSessionId: string;
  itemId: string;
  webUrl: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  siteId: string;
  driveId: string;
  path: string;
}

// ============================================================================
// DTOs - CSV IMPORT
// ============================================================================

export interface CsvImportPreviewResponse {
  jobId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    rowNumber: number;
    error: string;
  }>;
}

export interface CsvImportCommitResponse {
  jobId: string;
  successRows: number;
  failedRows: number;
}

// ============================================================================
// DTOs - INTEGRATIONS
// ============================================================================

export interface SharePointConfig {
  tenantId: string;
  siteId: string;
  driveId: string;
  baseFolderName: string;
}

export interface TeamsConfig {
  webhookUrl: string;
  weeklyReportDayOfWeek: number;
  weeklyReportTimeHHMM: string;
  timezone: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// DTOs - DASHBOARD
// ============================================================================

export interface TaskOwnerDashboard {
  pendingCount: number;
  dueThisWeekCount: number;
  overdueCount: number;
  recentTasks: ComplianceTask[];
}

export interface ReviewerDashboard {
  entityStats: Array<{
    entityId: string;
    entityName: string;
    pendingCount: number;
    completedCount: number;
    overdueCount: number;
  }>;
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    pendingCount: number;
    completedCount: number;
    overdueCount: number;
  }>;
  overdueTasks: ComplianceTask[];
}

export interface AdminDashboard {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalUsers: number;
  recentImports: CsvImportJob[];
  systemHealth: {
    dbConnected: boolean;
    sharePointConnected: boolean;
    teamsConnected: boolean;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
