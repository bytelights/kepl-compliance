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
  public doughnutChartType = 'doughnut' as const;
  public barChartType = 'bar' as const;
  public lineChartType = 'line' as const;
  
  public taskOwnerChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };
  
  public adminStatusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };
  
  public adminDepartmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  
  public adminOwnerChartData: ChartData<'bar'> = {
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
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Roboto', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 6
      }
    },
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Roboto', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 6
      }
    },
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Roboto', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
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
        backgroundColor: ['#FF9800', '#f44336', '#66BB6A'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }

  prepareAdminCharts(): void {
    if (!this.adminData) return;
    
    // Status distribution chart
    this.adminStatusChartData = {
      labels: ['Pending', 'Completed', 'Overdue'],
      datasets: [{
        data: [
          this.adminData.pendingTasks,
          this.adminData.completedTasks,
          this.adminData.overdueTasks
        ],
        backgroundColor: ['#FF9800', '#66BB6A', '#f44336'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
    
    // Department stats chart
    this.adminDepartmentChartData = {
      labels: this.adminData.departmentStats?.map(d => d.departmentName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.adminData.departmentStats?.map(d => d.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4
        },
        {
          label: 'Completed',
          data: this.adminData.departmentStats?.map(d => d.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4
        },
        {
          label: 'Overdue',
          data: this.adminData.departmentStats?.map(d => d.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4
        }
      ]
    };
    
    // Owner (assigned person) stats chart
    this.adminOwnerChartData = {
      labels: this.adminData.ownerStats?.map(o => o.ownerName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.adminData.ownerStats?.map(o => o.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4
        },
        {
          label: 'Completed',
          data: this.adminData.ownerStats?.map(o => o.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4
        },
        {
          label: 'Overdue',
          data: this.adminData.ownerStats?.map(o => o.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4
        }
      ]
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
          backgroundColor: '#FF9800',
          borderRadius: 4
        },
        {
          label: 'Completed',
          data: this.reviewerData.entityStats?.map(e => e.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4
        },
        {
          label: 'Overdue',
          data: this.reviewerData.entityStats?.map(e => e.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4
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
          backgroundColor: '#FF9800',
          borderRadius: 4
        },
        {
          label: 'Completed',
          data: this.reviewerData.departmentStats?.map(d => d.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4
        },
        {
          label: 'Overdue',
          data: this.reviewerData.departmentStats?.map(d => d.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4
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
