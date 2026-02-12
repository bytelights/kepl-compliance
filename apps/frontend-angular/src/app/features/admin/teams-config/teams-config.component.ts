import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-teams-config',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
  ],
  templateUrl: './teams-config.component.html',
  styleUrls: ['./teams-config.component.css'],
})
export class TeamsConfigComponent implements OnInit {
  configForm: FormGroup;
  loading = true;
  saving = false;
  testing = false;
  sendingTestReport = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogService: DialogService
  ) {
    this.configForm = this.fb.group({
      webhookUrl: ['', [Validators.required, Validators.pattern(/^https:\/\/.*\.webhook\.office\.com\/.*$/)]],
    });
  }

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/integrations/teams`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.configForm.patchValue({
            webhookUrl: response.data.webhookUrl || '',
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  saveConfig() {
    if (this.configForm.invalid) {
      this.snackBar.open('Please enter a valid Teams webhook URL', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.saving = true;
    const webhookUrl = this.configForm.value.webhookUrl;

    this.http.put<any>(`${environment.apiUrl}/integrations/teams`, { webhookUrl }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Teams configuration saved successfully', 'Close', {
            duration: 3000,
          });
        }
        this.saving = false;
      },
      error: (error) => {
        this.snackBar.open('Failed to save configuration: ' + error.message, 'Close', {
          duration: 5000,
        });
        this.saving = false;
      },
    });
  }

  testConnection() {
    if (this.configForm.invalid) {
      this.snackBar.open('Please enter a valid webhook URL first', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.testing = true;
    const webhookUrl = this.configForm.value.webhookUrl;

    this.http.post<any>(`${environment.apiUrl}/reports/teams/test`, { webhookUrl }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('✅ Test message sent successfully! Check your Teams channel.', 'Close', {
            duration: 5000,
          });
        }
        this.testing = false;
      },
      error: (error) => {
        this.snackBar.open('❌ Test failed: ' + error.message, 'Close', {
          duration: 5000,
        });
        this.testing = false;
      },
    });
  }

  sendTestReport() {
    if (this.configForm.invalid) return;

    this.sendingTestReport = true;
    const webhookUrl = this.configForm.value.webhookUrl;

    this.http.post<any>(`${environment.apiUrl}/reports/teams/test-report`, { webhookUrl }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Test report sent! Check your Teams channel.', 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('Failed: ' + response.message, 'Close', { duration: 5000 });
        }
        this.sendingTestReport = false;
      },
      error: (error) => {
        this.snackBar.open('Failed to send test report: ' + error.message, 'Close', { duration: 5000 });
        this.sendingTestReport = false;
      },
    });
  }

  triggerWeeklyReport() {
    this.dialogService.confirm({
      title: 'Send Weekly Report',
      message: 'Send weekly compliance report now?',
      confirmText: 'Send',
      cancelText: 'Cancel',
      isDanger: false
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.http.post<any>(`${environment.apiUrl}/reports/weekly/trigger`, {}).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Weekly report triggered successfully', 'Close', {
              duration: 3000,
            });
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to trigger report: ' + error.message, 'Close', {
            duration: 5000,
          });
        },
      });
    });
  }
}
