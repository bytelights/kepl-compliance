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
