import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CsvImportService } from '../../../core/services/csv-import.service';
import { CsvImportJob } from '../../../core/models';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './csv-import.component.html',
  styleUrls: ['./csv-import.component.css'],
})
export class CsvImportComponent implements OnInit {
  selectedFile: File | null = null;
  uploading = false;
  loadingHistory = true;
  importHistory: CsvImportJob[] = [];

  displayedColumns = ['fileName', 'mode', 'status', 'rows', 'uploader', 'createdAt'];

  constructor(
    private csvImportService: CsvImportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      this.selectedFile = file;
    } else {
      this.snackBar.open('Please select a valid CSV file', 'Close', {
        duration: 3000,
      });
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
          this.snackBar.open(
            `Preview Complete! Total: ${job.totalRows}, Valid: ${job.validRows}, Errors: ${job.errorRows}`,
            'Close',
            { duration: 5000 }
          );
          this.loadHistory();
        }
      },
      error: (error) => {
        this.uploading = false;
        this.snackBar.open(
          'Preview failed: ' + (error.error?.message || 'Unknown error'),
          'Close',
          { duration: 5000 }
        );
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
          this.snackBar.open(
            `Import Complete! ${job.validRows} tasks created successfully. Total: ${job.totalRows}, Errors: ${job.errorRows}`,
            'Close',
            { duration: 5000 }
          );
          this.clearFile();
          this.loadHistory();
        }
      },
      error: (error) => {
        this.uploading = false;
        this.snackBar.open(
          'Import failed: ' + (error.error?.message || 'Unknown error'),
          'Close',
          { duration: 5000 }
        );
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
