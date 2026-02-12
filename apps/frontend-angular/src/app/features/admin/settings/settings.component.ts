import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { DashboardService } from '../../../core/services/dashboard.service';
import { SystemHealth } from '../../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  loading = false;
  
  // SharePoint config
  sharepointConfig = {
    tenantId: '',
    siteId: '',
    driveId: '',
    baseFolderName: 'Compliance-Documents',
  };
  sharepointTesting = false;
  sharepointSaving = false;

  // Teams config
  teamsConfig = {
    webhookUrl: '',
    channelName: '',
    sendDailySummary: false,
    alertOverdue: false,
    notifyCompletion: false,
    weeklyReports: false,
  };
  teamsTesting = false;
  teamsSaving = false;
  teamsSendingTestReport = false;

  // System Health
  systemHealth: SystemHealth | null = null;
  healthLoading = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadConfigurations();
    this.loadSystemHealth();
  }

  loadConfigurations(): void {
    this.loading = true;
    
    // Load SharePoint config
    this.http.get<any>(`${environment.apiUrl}/integrations/sharepoint`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sharepointConfig = { ...this.sharepointConfig, ...response.data };
        }
      },
      error: (err) => {
        console.error('Failed to load SharePoint config:', err);
      },
    });

    // Load Teams config
    this.http.get<any>(`${environment.apiUrl}/integrations/teams`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teamsConfig = { ...this.teamsConfig, ...response.data };
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load Teams config:', err);
        this.loading = false;
      },
    });
  }

  // SharePoint methods
  saveSharePointConfig(): void {
    this.sharepointSaving = true;
    this.http.put<any>(`${environment.apiUrl}/integrations/sharepoint`, this.sharepointConfig).subscribe({
      next: (response) => {
        this.sharepointSaving = false;
        if (response.success) {
          this.snackBar.open('SharePoint configuration saved successfully', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.sharepointSaving = false;
        this.snackBar.open('Failed to save configuration: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
      },
    });
  }

  testSharePointConnection(): void {
    this.sharepointTesting = true;
    this.http.post<any>(`${environment.apiUrl}/integrations/sharepoint/test`, {}).subscribe({
      next: (response) => {
        this.sharepointTesting = false;
        if (response.success) {
          this.snackBar.open('✓ ' + response.message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        } else {
          this.snackBar.open('✗ ' + response.message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      },
      error: (err) => {
        this.sharepointTesting = false;
        this.snackBar.open('Connection failed: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      },
    });
  }

  // Teams methods
  saveTeamsConfig(): void {
    this.teamsSaving = true;
    this.http.put<any>(`${environment.apiUrl}/integrations/teams`, this.teamsConfig).subscribe({
      next: (response) => {
        this.teamsSaving = false;
        if (response.success) {
          this.snackBar.open('Teams configuration saved successfully', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.teamsSaving = false;
        this.snackBar.open('Failed to save configuration: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
      },
    });
  }

  testTeamsWebhook(): void {
    this.teamsTesting = true;
    this.http.post<any>(`${environment.apiUrl}/integrations/teams/test`, {}).subscribe({
      next: (response) => {
        this.teamsTesting = false;
        if (response.success) {
          this.snackBar.open('✓ Test message sent successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        } else {
          this.snackBar.open('✗ ' + response.message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      },
      error: (err) => {
        this.teamsTesting = false;
        this.snackBar.open('Failed to send test message: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      },
    });
  }

  sendTestReport(): void {
    this.teamsSendingTestReport = true;
    const webhookUrl = this.teamsConfig.webhookUrl;
    this.http.post<any>(`${environment.apiUrl}/reports/teams/test-report`, { webhookUrl }).subscribe({
      next: (response) => {
        this.teamsSendingTestReport = false;
        if (response.success) {
          this.snackBar.open('Test report sent! Check your Teams channel.', 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Failed: ' + response.message, 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.teamsSendingTestReport = false;
        this.snackBar.open('Failed to send test report: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
      },
    });
  }

  // System Health methods
  loadSystemHealth(): void {
    this.healthLoading = true;
    this.dashboardService.getSystemHealth().subscribe({
      next: (response) => {
        this.healthLoading = false;
        if (response.success && response.data) {
          this.systemHealth = response.data;
        }
      },
      error: (err) => {
        this.healthLoading = false;
        console.error('Failed to load system health:', err);
      },
    });
  }

  refreshSystemHealth(): void {
    this.loadSystemHealth();
  }
}
