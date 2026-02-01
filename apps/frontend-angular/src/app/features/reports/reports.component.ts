import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  dateFilterForm: FormGroup;
  exporting = {
    compliance: false,
    department: false,
    overdue: false,
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.dateFilterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
    });
  }

  ngOnInit() {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.dateFilterForm.patchValue({
      startDate,
      endDate,
    });
  }

  exportComplianceSummary() {
    this.exporting.compliance = true;
    const { startDate, endDate } = this.dateFilterForm.value;

    let url = `${environment.apiUrl}/reports/export/compliance-summary`;

    if (startDate && endDate) {
      const params = new URLSearchParams({
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      });
      url += `?${params.toString()}`;
    }

    this.downloadFile(url, 'compliance')
      .finally(() => {
        this.exporting.compliance = false;
      });
  }

  exportDepartmentReport() {
    this.exporting.department = true;
    const url = `${environment.apiUrl}/reports/export/department-report`;

    this.downloadFile(url, 'department')
      .finally(() => {
        this.exporting.department = false;
      });
  }

  exportOverdueTasks() {
    this.exporting.overdue = true;
    const url = `${environment.apiUrl}/reports/export/overdue-tasks`;

    this.downloadFile(url, 'overdue')
      .finally(() => {
        this.exporting.overdue = false;
      });
  }

  private async downloadFile(url: string, reportType: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${reportType}-report-${this.formatDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      this.snackBar.open(`${reportType} report downloaded successfully`, 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open(`Failed to export ${reportType} report`, 'Close', {
        duration: 5000,
      });
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  clearDateFilter() {
    this.dateFilterForm.patchValue({
      startDate: null,
      endDate: null,
    });
  }
}
