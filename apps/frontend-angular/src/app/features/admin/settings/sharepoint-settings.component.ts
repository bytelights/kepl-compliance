import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sharepoint-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './sharepoint-settings.component.html',
  styleUrls: ['./sharepoint-settings.component.css'],
})
export class SharePointSettingsComponent implements OnInit {
  loading = false;
  testing = false;
  saving = false;

  config = {
    tenantId: '',
    siteId: '',
    driveId: '',
    baseFolderName: 'Compliance-Documents',
  };

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/integrations/sharepoint`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.config = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  saveConfig(): void {
    this.saving = true;
    this.http.put<any>(`${environment.apiUrl}/integrations/sharepoint`, this.config).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open('SharePoint configuration saved successfully', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('Failed to save configuration: ' + err.error?.message, 'Close', { duration: 5000 });
      },
    });
  }

  testConnection(): void {
    this.testing = true;
    this.http.post<any>(`${environment.apiUrl}/integrations/sharepoint/test`, {}).subscribe({
      next: (response) => {
        this.testing = false;
        if (response.success) {
          this.snackBar.open('SharePoint connection successful!', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.testing = false;
        this.snackBar.open('Connection failed: ' + err.error?.message, 'Close', { duration: 5000 });
      },
    });
  }
}
