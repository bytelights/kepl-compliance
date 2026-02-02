// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'reviewer' | 'task_owner';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Master Data
export interface Entity {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Law {
  id: string;
  name: string;
  description?: string;
}

export interface ComplianceMaster {
  id: string;
  complianceId: string;
  title: string;
  description?: string;
  lawId: string;
  departmentId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
  law?: Law;
  department?: Department;
}

// Task
export interface ComplianceTask {
  id: string;
  complianceId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  dueDate?: string;
  completedAt?: string;
  skippedAt?: string;
  lawId: string;
  departmentId: string;
  entityId: string;
  ownerId: string;
  reviewerId: string;
  frequency: string;
  impact?: string;
  createdAt: string;
  updatedAt: string;
  law?: Law;
  department?: Department;
  entity?: Entity;
  owner?: User;
  reviewer?: User;
  evidenceFiles?: EvidenceFile[];
}

// Evidence
export interface EvidenceFile {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sharepointFileId: string;
  sharepointWebUrl: string;
  uploadedById: string;
  uploadedAt: string;
  uploadedBy?: User;
}

// CSV Import
export interface CsvImportJob {
  id: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'PREVIEW';
  mode: string;
  uploadedBy: string;
  createdAt: string;
  completedAt?: string;
  uploader?: User;
  rows?: CsvImportJobRow[];
}

export interface CsvImportJobRow {
  id: string;
  jobId: string;
  rowNumber: number;
  success: boolean;
  errorMsg?: string;
  rowData: any;
  createdAt: string;
}

export interface CsvImportResponse {
  jobId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  job: CsvImportJob;
  errors: Array<{
    rowNumber: number;
    errors: string[];
  }>;
}

// Dashboard
export interface TaskOwnerDashboard {
  pendingCount: number;
  dueThisWeekCount: number;
  overdueCount: number;
  recentTasks: ComplianceTask[];
}

export interface ReviewerDashboard {
  entityStats: EntityStat[];
  departmentStats: DepartmentStat[];
  overdueTasks: ComplianceTask[];
}

export interface AdminDashboard {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalUsers: number;
  recentImports: CsvImportJob[];
  departmentStats: DepartmentStat[];
  ownerStats: OwnerStat[];
  systemHealth: {
    dbConnected: boolean;
    sharePointConnected: boolean;
    teamsConnected: boolean;
  };
}

export interface EntityStat {
  entityId: string;
  entityName: string;
  totalTasks: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
}

export interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  totalTasks: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
}

export interface OwnerStat {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  totalTasks: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
