import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, ChartEvent, ActiveElement } from 'chart.js';
import { AuthService, CurrentUser } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { TaskOwnerDashboard, ReviewerDashboard, AdminDashboard } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
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

  // Date Filter Form
  dateFilterForm: FormGroup;
  financialYearOptions: { label: string; value: string }[] = [];

  // Chart configurations
  public doughnutChartType = 'doughnut' as const;
  public barChartType = 'bar' as const;
  public lineChartType = 'line' as const;

  public taskOwnerChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };

  public adminStatusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };

  public adminDepartmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public adminOwnerChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public adminTrendsChartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };

  public reviewerEntityChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public reviewerDepartmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  public reviewerStatusChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [],
  };

  public reviewerLawChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
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
            family: "'Roboto', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 6,
      },
    },
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '90%',
    onClick: (event: ChartEvent, active: ActiveElement[]) => this.onDoughnutChartClick(event, active),
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 13,
            family: "'Roboto', sans-serif",
          },
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 14,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
      },
    },
  };

  private getBarChartOptions(chartType: 'department' | 'owner' | 'entity' | 'law'): ChartConfiguration<'bar'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_event: ChartEvent, active: ActiveElement[]) => this.onBarChartClick(chartType, _event, active),
      datasets: {
        bar: {
          maxBarThickness: 10,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: { size: 13, family: "'Roboto', sans-serif" },
            boxWidth: 8,
            boxHeight: 8,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 14,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          cornerRadius: 8,
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          boxPadding: 6,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { size: 12 }, padding: 8 },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 }, padding: 8 },
        },
      },
    };
  }

  public departmentBarChartOptions = this.getBarChartOptions('department');
  public ownerBarChartOptions = this.getBarChartOptions('owner');
  public entityBarChartOptions = this.getBarChartOptions('entity');
  public lawBarChartOptions = this.getBarChartOptions('law');

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 13,
            family: "'Roboto', sans-serif",
          },
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 14,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
          },
          stepSize: 1,
          padding: 8,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          padding: 8,
        },
      },
    },
  };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.dateFilterForm = this.fb.group({
      filterType: ['all'],
      startDate: [null],
      endDate: [null],
      financialYear: [''],
    });
    this.financialYearOptions = this.generateFinancialYearOptions();
  }

  private generateFinancialYearOptions(): { label: string; value: string }[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    // FY starts in April: if month >= 4, current FY starts this year, else last year
    const currentFYStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;

    const options: { label: string; value: string }[] = [];
    // Generate current FY + 4 previous FYs (5 total)
    for (let i = 0; i < 5; i++) {
      const startYear = currentFYStartYear - i;
      const endYear = startYear + 1;
      const label = i === 0
        ? `Current FY (${startYear}-${endYear})`
        : i === 1
          ? `Last FY (${startYear}-${endYear})`
          : `FY ${startYear}-${endYear}`;
      options.push({ label, value: `${startYear}-${String(endYear).slice(2)}` });
    }
    return options;
  }
  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;

    const { startDate, endDate } = this.getDateRange();

    if (this.isAdmin()) {
      this.dashboardService.getAdminDashboard(startDate, endDate).subscribe({
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
      this.dashboardService.getReviewerDashboard(startDate, endDate).subscribe({
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
      this.dashboardService.getTaskOwnerDashboard(startDate, endDate).subscribe({
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

    const completed =
      this.taskOwnerData.recentTasks?.filter((t) => t.status === 'COMPLETED').length || 0;
    const pending = this.taskOwnerData.pendingCount;
    const overdue = this.taskOwnerData.overdueCount;

    this.taskOwnerChartData = {
      labels: ['Pending', 'Overdue', 'Completed'],
      datasets: [
        {
          data: [pending, overdue, completed],
          backgroundColor: ['#FF9800', '#f44336', '#66BB6A'],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }

  prepareAdminCharts(): void {
    if (!this.adminData) return;

    // Status distribution chart
    this.adminStatusChartData = {
      labels: ['Pending', 'Completed', 'Skipped', 'Overdue'],
      datasets: [
        {
          data: [
            this.adminData.pendingTasks,
            this.adminData.completedTasks,
            this.adminData.skippedTasks,
            this.adminData.overdueTasks,
          ],
          backgroundColor: ['#FF9800', '#66BB6A', '#9E9E9E', '#f44336'],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };

    // Department stats chart
    this.adminDepartmentChartData = {
      labels: this.adminData.departmentStats?.map((d) => d.departmentName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.adminData.departmentStats?.map((d) => d.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: this.adminData.departmentStats?.map((d) => d.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4,
        },
        {
          label: 'Skipped',
          data: this.adminData.departmentStats?.map((d) => d.skippedCount) || [],
          backgroundColor: '#9E9E9E',
          borderRadius: 4,
        },
        {
          label: 'Overdue',
          data: this.adminData.departmentStats?.map((d) => d.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4,
        },
      ],
    };

    // Owner (assigned person) stats chart
    this.adminOwnerChartData = {
      labels: this.adminData.ownerStats?.map((o) => o.ownerName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.adminData.ownerStats?.map((o) => o.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: this.adminData.ownerStats?.map((o) => o.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4,
        },
        {
          label: 'Skipped',
          data: this.adminData.ownerStats?.map((o) => o.skippedCount) || [],
          backgroundColor: '#9E9E9E',
          borderRadius: 4,
        },
        {
          label: 'Overdue',
          data: this.adminData.ownerStats?.map((o) => o.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4,
        },
      ],
    };

    // Task completion trends chart
    this.adminTrendsChartData = {
      labels: this.adminData.trendData?.labels || [],
      datasets: [
        {
          label: 'Tasks Created',
          data: this.adminData.trendData?.created || [],
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Tasks Completed',
          data: this.adminData.trendData?.completed || [],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }

  prepareReviewerCharts(): void {
    if (!this.reviewerData) return;

    // Status distribution doughnut
    this.reviewerStatusChartData = {
      labels: ['Pending', 'Completed', 'Skipped', 'Overdue'],
      datasets: [
        {
          data: [
            this.reviewerData.pendingTasks,
            this.reviewerData.completedTasks,
            this.reviewerData.skippedTasks,
            this.reviewerData.overdueTasks,
          ],
          backgroundColor: ['#FF9800', '#66BB6A', '#9E9E9E', '#f44336'],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };

    // Entity chart
    this.reviewerEntityChartData = {
      labels: this.reviewerData.entityStats?.map((e) => e.entityName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.reviewerData.entityStats?.map((e) => e.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: this.reviewerData.entityStats?.map((e) => e.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4,
        },
        {
          label: 'Overdue',
          data: this.reviewerData.entityStats?.map((e) => e.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4,
        },
      ],
    };

    // Department chart
    this.reviewerDepartmentChartData = {
      labels: this.reviewerData.departmentStats?.map((d) => d.departmentName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.reviewerData.departmentStats?.map((d) => d.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: this.reviewerData.departmentStats?.map((d) => d.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4,
        },
        {
          label: 'Overdue',
          data: this.reviewerData.departmentStats?.map((d) => d.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4,
        },
      ],
    };

    // Law chart
    this.reviewerLawChartData = {
      labels: this.reviewerData.lawStats?.map((l) => l.lawName) || [],
      datasets: [
        {
          label: 'Pending',
          data: this.reviewerData.lawStats?.map((l) => l.pendingCount) || [],
          backgroundColor: '#FF9800',
          borderRadius: 4,
        },
        {
          label: 'Completed',
          data: this.reviewerData.lawStats?.map((l) => l.completedCount) || [],
          backgroundColor: '#66BB6A',
          borderRadius: 4,
        },
        {
          label: 'Overdue',
          data: this.reviewerData.lawStats?.map((l) => l.overdueCount) || [],
          backgroundColor: '#f44336',
          borderRadius: 4,
        },
      ],
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

  getDateRange(): { startDate?: string; endDate?: string } {
    const filterType = this.dateFilterForm.get('filterType')?.value;

    if (filterType === 'all') {
      return {};
    }

    if (filterType === 'last30days') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    }

    if (filterType === 'dateRange') {
      const startDate = this.dateFilterForm.get('startDate')?.value;
      const endDate = this.dateFilterForm.get('endDate')?.value;
      return {
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : undefined,
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
      };
    }

    if (filterType === 'financialYear') {
      const fyValue = this.dateFilterForm.get('financialYear')?.value;
      return this.getFinancialYearDates(fyValue);
    }

    return {};
  }

  getFinancialYearDates(fyValue: string): { startDate: string; endDate: string } {
    // Financial year in India: April 1 to March 31
    // fyValue format: "2025-26"
    if (!fyValue || !fyValue.includes('-')) {
      return { startDate: '', endDate: '' };
    }
    const startYear = parseInt(fyValue.split('-')[0], 10);
    if (isNaN(startYear)) {
      return { startDate: '', endDate: '' };
    }
    return {
      startDate: `${startYear}-04-01`,
      endDate: `${startYear + 1}-03-31`,
    };
  }

  applyDateFilter() {
    this.loadDashboardData();
  }

  resetDateFilter() {
    this.dateFilterForm.patchValue({
      filterType: 'all',
      startDate: null,
      endDate: null,
      financialYear: '',
    });
    this.loadDashboardData();
  }

  private statusLabelMap: Record<string, string> = {
    'Pending': 'PENDING',
    'Completed': 'COMPLETED',
    'Skipped': 'SKIPPED',
    'Overdue': 'PENDING',
  };

  onBarChartClick(chartType: 'department' | 'owner' | 'entity' | 'law', _event: ChartEvent, active: ActiveElement[]) {
    if (!active.length) return;

    const element = active[0];
    const datasetIndex = element.datasetIndex;
    const index = element.index;

    let queryParams: any = {};

    // Get the status from the dataset label
    let datasetLabel = '';
    if (chartType === 'department') {
      if (this.adminData?.departmentStats) {
        datasetLabel = this.adminDepartmentChartData.datasets[datasetIndex]?.label || '';
        queryParams.departmentId = this.adminData.departmentStats[index]?.departmentId;
      } else if (this.reviewerData?.departmentStats) {
        datasetLabel = this.reviewerDepartmentChartData.datasets[datasetIndex]?.label || '';
        queryParams.departmentId = this.reviewerData.departmentStats[index]?.departmentId;
      }
    } else if (chartType === 'owner' && this.adminData?.ownerStats) {
      datasetLabel = this.adminOwnerChartData.datasets[datasetIndex]?.label || '';
      queryParams.ownerId = this.adminData.ownerStats[index]?.ownerId;
    } else if (chartType === 'entity' && this.reviewerData?.entityStats) {
      datasetLabel = this.reviewerEntityChartData.datasets[datasetIndex]?.label || '';
      queryParams.entityId = this.reviewerData.entityStats[index]?.entityId;
    } else if (chartType === 'law' && this.reviewerData?.lawStats) {
      datasetLabel = this.reviewerLawChartData.datasets[datasetIndex]?.label || '';
      queryParams.lawId = this.reviewerData.lawStats[index]?.lawId;
    }

    const status = this.statusLabelMap[datasetLabel];
    if (status) queryParams.status = status;

    this.router.navigate(['/tasks'], { queryParams });
  }

  onDoughnutChartClick(_event: ChartEvent, active: ActiveElement[]) {
    if (!active.length) return;
    const index = active[0].index;

    const labels = ['PENDING', 'COMPLETED', 'SKIPPED', 'PENDING'];
    const status = labels[index];
    if (status) {
      this.router.navigate(['/tasks'], { queryParams: { status } });
    }
  }

  onFilterTypeChange() {
    const filterType = this.dateFilterForm.get('filterType')?.value;

    // Reset all other filter fields
    if (filterType !== 'dateRange') {
      this.dateFilterForm.patchValue({ startDate: null, endDate: null });
    }
    if (filterType !== 'financialYear') {
      this.dateFilterForm.patchValue({ financialYear: '' });
    }
  }
}
