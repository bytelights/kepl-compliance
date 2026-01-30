import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { CsvImportService } from '../../../core/services/csv-import.service';
import { CsvImportJob } from '../../../core/models';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
  ],
  template: `
    <div class="csv-import-container">
      <div class="header">
        <h1>CSV Bulk Import</h1>
      </div>

      <!-- Upload Section -->
      <mat-card class="upload-card">
        <mat-card-header>
          <mat-card-title>Upload CSV File</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="upload-area" (click)="fileInput.click()" [class.uploading]="uploading">
            <mat-icon>cloud_upload</mat-icon>
            <p>Click to select CSV file</p>
            <input
              #fileInput
              type="file"
              accept=".csv"
              (change)="onFileSelected($event)"
              style="display: none"
            />
          </div>

          <div *ngIf="selectedFile" class="file-info">
            <mat-icon>description</mat-icon>
            <span>{{ selectedFile.name }}</span>
            <button mat-icon-button (click)="clearFile()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="action-buttons" *ngIf="selectedFile">
            <button
              mat-raised-button
              color="accent"
              (click)="preview()"
              [disabled]="uploading"
            >
              <mat-icon>visibility</mat-icon>
              Preview
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="commit()"
              [disabled]="uploading"
            >
              <mat-icon>check</mat-icon>
              Import
            </button>
          </div>

          <div *ngIf="uploading" class="upload-progress">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Processing...</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Import History -->
      <mat-card class="history-card">
        <mat-card-header>
          <mat-card-title>Import History</mat-card-title>
          <button mat-icon-button (click)="loadHistory()">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loadingHistory" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>

          <div *ngIf="!loadingHistory && importHistory.length === 0" class="empty-state">
            <mat-icon>history</mat-icon>
            <p>No import history</p>
          </div>

          <table mat-table [dataSource]="importHistory" *ngIf="!loadingHistory && importHistory.length">
            <ng-container matColumnDef="fileName">
              <th mat-header-cell *matHeaderCellDef>File Name</th>
              <td mat-cell *matCellDef="let job">{{ job.fileName }}</td>
            </ng-container>

            <ng-container matColumnDef="mode">
              <th mat-header-cell *matHeaderCellDef>Mode</th>
              <td mat-cell *matCellDef="let job">
                <mat-chip [class]="'mode-' + job.mode">{{ job.mode }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let job">
                <mat-chip [class]="'status-' + job.status">{{ job.status }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="rows">
              <th mat-header-cell *matHeaderCellDef>Rows</th>
              <td mat-cell *matCellDef="let job">
                Total: {{ job.totalRows }} | Valid: {{ job.validRows }} | Errors: {{ job.errorRows }}
              </td>
            </ng-container>

            <ng-container matColumnDef="uploader">
              <th mat-header-cell *matHeaderCellDef>Uploader</th>
              <td mat-cell *matCellDef="let job">{{ job.uploader?.name }}</td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let job">{{ job.createdAt | date: 'short' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .csv-import-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .header {
        margin-bottom: 24px;
      }

      .header h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 500;
        color: #1976d2;
      }

      .upload-card,
      .history-card {
        margin-bottom: 24px;
      }

      .upload-area {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 48px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
      }

      .upload-area:hover {
        border-color: #1976d2;
        background-color: #f5f5f5;
      }

      .upload-area.uploading {
        pointer-events: none;
        opacity: 0.6;
      }

      .upload-area mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #1976d2;
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .file-info span {
        flex: 1;
      }

      .action-buttons {
        display: flex;
        gap: 16px;
        margin-top: 16px;
        justify-content: center;
      }

      .upload-progress {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-top: 24px;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 48px;
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
        color: #ccc;
      }

      table {
        width: 100%;
      }

      .mode-PREVIEW {
        background-color: #2196f3 !important;
        color: white !important;
      }

      .mode-COMMIT {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .status-COMPLETED {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .status-FAILED {
        background-color: #f44336 !important;
        color: white !important;
      }

      .status-PENDING {
        background-color: #ff9800 !important;
        color: white !important;
      }

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `,
  ],
})
export class CsvImportComponent implements OnInit {
  selectedFile: File | null = null;
  uploading = false;
  loadingHistory = true;
  importHistory: CsvImportJob[] = [];

  displayedColumns = ['fileName', 'mode', 'status', 'rows', 'uploader', 'createdAt'];

  constructor(private csvImportService: CsvImportService) {}

  ngOnInit() {
    this.loadHistory();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      this.selectedFile = file;
    } else {
      alert('Please select a valid CSV file');
    }
  }

  clearFile() {
    this.selectedFile = null;
  }

  preview() {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.csvImportService.importCsv(this.selectedFile, 'preview').subscribe({
      next: (response) => {
        this.uploading = false;
        if (response.success && response.data) {
          const job = response.data;
          alert(
            `Preview Complete!\n\nTotal Rows: ${job.totalRows}\nValid Rows: ${job.validRows}\nError Rows: ${job.errorRows}`
          );
          this.loadHistory();
        }
      },
      error: (error) => {
        this.uploading = false;
        alert('Preview failed: ' + (error.error?.message || 'Unknown error'));
      },
    });
  }

  commit() {
    if (!this.selectedFile) return;

    if (!confirm('Are you sure you want to import this file? This will create tasks in the database.')) {
      return;
    }

    this.uploading = true;
    this.csvImportService.importCsv(this.selectedFile, 'commit').subscribe({
      next: (response) => {
        this.uploading = false;
        if (response.success && response.data) {
          const job = response.data;
          alert(
            `Import Complete!\n\nTotal Rows: ${job.totalRows}\nValid Rows: ${job.validRows}\nError Rows: ${job.errorRows}\n\n${job.validRows} tasks created successfully!`
          );
          this.clearFile();
          this.loadHistory();
        }
      },
      error: (error) => {
        this.uploading = false;
        alert('Import failed: ' + (error.error?.message || 'Unknown error'));
      },
    });
  }

  loadHistory() {
    this.loadingHistory = true;
    this.csvImportService.getImportJobs().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.importHistory = response.data;
        }
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      },
    });
  }
}
