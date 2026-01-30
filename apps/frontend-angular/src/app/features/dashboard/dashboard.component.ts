import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService, CurrentUser } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  TaskOwnerDashboard,
  ReviewerDashboard,
  AdminDashboard,
} from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  user: CurrentUser | null = null;
  loading = true;
  
  taskOwnerData: TaskOwnerDashboard | null = null;
  reviewerData: ReviewerDashboard | null = null;
  adminData: AdminDashboard | null = null;

  taskColumns = ['complianceId', 'title', 'entity', 'dueDate', 'status', 'actions'];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;

    if (this.isAdmin()) {
      this.dashboardService.getAdminDashboard().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.adminData = response.data;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else if (this.isReviewer()) {
      this.dashboardService.getReviewerDashboard().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.reviewerData = response.data;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else if (this.isTaskOwner()) {
      this.dashboardService.getTaskOwnerDashboard().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.taskOwnerData = response.data;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isReviewer(): boolean {
    return this.authService.isReviewer();
  }

  isTaskOwner(): boolean {
    return this.authService.isTaskOwner();
  }

  isOverdue(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}
    <mat-toolbar color="primary">
      <span>Compliance Management System</span>
      <span class="spacer"></span>
      <span>{{ user?.name || user?.email }}</span>
      <button mat-icon-button (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome back, {{ user?.name }}!</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
      </div>

      <!-- Task Owner Dashboard -->
      <div *ngIf="!loading && isTaskOwner()" class="dashboard-content">
        <div class="stats-grid">
          <mat-card class="stat-card pending">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>assignment</mat-icon></div>
              <div class="stat-value">{{ taskOwnerData?.pendingCount || 0 }}</div>
              <div class="stat-label">Pending Tasks</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card warning">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>schedule</mat-icon></div>
              <div class="stat-value">{{ taskOwnerData?.dueThisWeekCount || 0 }}</div>
              <div class="stat-label">Due This Week</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card danger">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>warning</mat-icon></div>
              <div class="stat-value">{{ taskOwnerData?.overdueCount || 0 }}</div>
              <div class="stat-label">Overdue</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Tasks -->
        <mat-card class="recent-tasks-card">
          <mat-card-header>
            <mat-card-title>Your Recent Tasks</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="!taskOwnerData?.recentTasks?.length" class="empty-state">
              <mat-icon>check_circle</mat-icon>
              <p>No pending tasks. Great job!</p>
            </div>

            <table mat-table [dataSource]="taskOwnerData?.recentTasks || []" *ngIf="taskOwnerData?.recentTasks?.length">
              <ng-container matColumnDef="complianceId">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let task">{{ task.complianceId }}</td>
              </ng-container>

              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let task">{{ task.title }}</td>
              </ng-container>

              <ng-container matColumnDef="entity">
                <th mat-header-cell *matHeaderCellDef>Entity</th>
                <td mat-cell *matCellDef="let task">{{ task.entity?.name }}</td>
              </ng-container>

              <ng-container matColumnDef="dueDate">
                <th mat-header-cell *matHeaderCellDef>Due Date</th>
                <td mat-cell *matCellDef="let task">
                  <span [class.overdue]="isOverdue(task.dueDate)">
                    {{ task.dueDate | date: 'MMM d, y' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let task">
                  <mat-chip [class]="'status-' + task.status">{{ task.status }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let task">
                  <button mat-button color="primary" [routerLink]="['/tasks', task.id]">
                    View
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="taskColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: taskColumns"></tr>
            </table>

            <div class="view-all-btn" *ngIf="taskOwnerData?.recentTasks?.length">
              <button mat-raised-button color="primary" routerLink="/tasks">
                View All Tasks
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Reviewer/Admin Dashboard -->
      <div *ngIf="!loading && (isReviewer() || isAdmin())" class="dashboard-content">
        <div class="stats-grid" *ngIf="isAdmin() && adminData">
          <mat-card class="stat-card primary">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>assignment</mat-icon></div>
              <div class="stat-value">{{ adminData.totalTasks }}</div>
              <div class="stat-label">Total Tasks</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card pending">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>pending_actions</mat-icon></div>
              <div class="stat-value">{{ adminData.pendingTasks }}</div>
              <div class="stat-label">Pending</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card success">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>check_circle</mat-icon></div>
              <div class="stat-value">{{ adminData.completedTasks }}</div>
              <div class="stat-label">Completed</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card danger">
            <mat-card-content>
              <div class="stat-icon"><mat-icon>warning</mat-icon></div>
              <div class="stat-value">{{ adminData.overdueTasks }}</div>
              <div class="stat-label">Overdue</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Actions -->
        <mat-card class="actions-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" routerLink="/tasks">
                <mat-icon>view_list</mat-icon>
                View All Tasks
              </button>
              <button mat-raised-button color="accent" routerLink="/tasks" [queryParams]="{status: 'PENDING'}">
                <mat-icon>pending_actions</mat-icon>
                Pending Tasks
              </button>
              @if (isAdmin()) {
                <button mat-raised-button color="warn" routerLink="/admin/csv-import">
                  <mat-icon>upload_file</mat-icon>
                  Import CSV
                </button>
                <button mat-raised-button routerLink="/admin/users">
                  <mat-icon>people</mat-icon>
                  Manage Users
                </button>
                <button mat-raised-button routerLink="/admin/master-data">
                  <mat-icon>storage</mat-icon>
                  Master Data
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .spacer {
        flex: 1 1 auto;
      }

      .dashboard-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 32px;
      }

      .dashboard-header h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 500;
        color: #1976d2;
      }

      .subtitle {
        margin: 8px 0 0 0;
        color: #666;
        font-size: 16px;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }

      .stat-card mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
      }

      .stat-icon mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: rgba(0, 0, 0, 0.54);
      }

      .stat-value {
        font-size: 48px;
        font-weight: 500;
        margin: 12px 0 8px 0;
      }

      .stat-label {
        font-size: 14px;
        color: #666;
      }

      .stat-card.primary { border-left: 4px solid #1976d2; }
      .stat-card.pending { border-left: 4px solid #ff9800; }
      .stat-card.warning { border-left: 4px solid #ffc107; }
      .stat-card.danger { border-left: 4px solid #f44336; }
      .stat-card.success { border-left: 4px solid #4caf50; }

      .recent-tasks-card {
        margin-top: 24px;
      }

      .empty-state {
        text-align: center;
        padding: 48px;
        color: #666;
      }

      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #4caf50;
      }

      table {
        width: 100%;
      }

      .overdue {
        color: #f44336;
        font-weight: 500;
      }

      mat-chip {
        font-size: 12px;
      }

      .status-PENDING {
        background-color: #ff9800 !important;
        color: white !important;
      }

      .status-COMPLETED {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .status-SKIPPED {
        background-color: #9e9e9e !important;
        color: white !important;
      }

      .view-all-btn {
        margin-top: 16px;
        text-align: center;
      }

      .actions-card {
        margin-top: 24px;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .action-buttons button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  user: CurrentUser | null = null;
  loading = true;
  
  taskOwnerData: TaskOwnerDashboard | null = null;
  reviewerData: ReviewerDashboard | null = null;
  adminData: AdminDashboard | null = null;

  taskColumns = ['complianceId', 'title', 'entity', 'dueDate', 'status', 'actions'];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;

    if (this.isAdmin()) {
      this.dashboardService.getAdminDashboard().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.adminData = response.data;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else if (this.isReviewer()) {
      this.dashboardService.getReviewerDashboard().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.reviewerData = response.data;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else if (this.isTaskOwner()) {
      this.dashboardService.getTaskOwnerDashboard().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.taskOwnerData = response.data;
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isReviewer(): boolean {
    return this.authService.isReviewer();
  }

  isTaskOwner(): boolean {
    return this.authService.isTaskOwner();
  }

  isOverdue(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}
