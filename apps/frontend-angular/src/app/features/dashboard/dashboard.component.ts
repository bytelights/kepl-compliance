import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
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
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    BaseChartDirective,
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

  // Chart configurations
  public doughnutChartType: ChartType = 'doughnut';
  public barChartType: ChartType = 'bar';
  public lineChartType: ChartType = 'line';
  
  public taskOwnerChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };
  
  public adminStatusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };
  
  public reviewerEntityChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  
  public reviewerDepartmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

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
            this.prepareAdminCharts();
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
            this.prepareReviewerCharts();
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
            this.prepareTaskOwnerCharts();
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  prepareTaskOwnerCharts(): void {
    if (!this.taskOwnerData) return;
    
    const completed = this.taskOwnerData.recentTasks?.filter(t => t.status === 'COMPLETED').length || 0;
    const pending = this.taskOwnerData.pendingCount;
    const overdue = this.taskOwnerData.overdueCount;
    
    this.taskOwnerChartData = {
      labels: ['Pending', 'Overdue', 'Completed'],
      datasets: [{
        data: [pending, overdue, completed],
        backgroundColor: ['#FFA726', '#EF5350', '#66BB6A'],
        borderWidth: 0
      }]
    };
  }

  prepareAdminCharts(): void {
    if (!this.adminData) return;
    
    this.adminStatusChartData = {
      labels: ['Pending', 'Completed', 'Overdue'],
      datasets: [{
        data: [
          this.adminData.pendingTasks,
          this.adminData.completedTasks,
          this.adminData.overdueTasks
        ],
        backgroundColor: ['#FFA726', '#66BB6A', '#EF5350'],
        borderWidth: 0
      }]
    };
  }

  prepareReviewerCharts(): void {
    if (!this.reviewerData) return;
    
    // Entity chart
    this.reviewerEntityChartData = {
      labels: this.reviewerData.entityStats?.map(e => e.entityName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.reviewerData.entityStats?.map(e => e.pendingCount) || [],
          backgroundColor: '#FFA726',
        },
        {
          label: 'Completed',
          data: this.reviewerData.entityStats?.map(e => e.completedCount) || [],
          backgroundColor: '#66BB6A',
        },
        {
          label: 'Overdue',
          data: this.reviewerData.entityStats?.map(e => e.overdueCount) || [],
          backgroundColor: '#EF5350',
        }
      ]
    };
    
    // Department chart
    this.reviewerDepartmentChartData = {
      labels: this.reviewerData.departmentStats?.map(d => d.departmentName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.reviewerData.departmentStats?.map(d => d.pendingCount) || [],
          backgroundColor: '#FFA726',
        },
        {
          label: 'Completed',
          data: this.reviewerData.departmentStats?.map(d => d.completedCount) || [],
          backgroundColor: '#66BB6A',
        },
        {
          label: 'Overdue',
          data: this.reviewerData.departmentStats?.map(d => d.overdueCount) || [],
          backgroundColor: '#EF5350',
        }
      ]
    };
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
