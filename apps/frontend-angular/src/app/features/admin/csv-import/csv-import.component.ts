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
import { CsvImportJob, CsvImportResponse } from '../../../core/models';
import { DialogService } from '../../../shared/services/dialog.service';

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
  selectingFile = false;
  importHistory: CsvImportJob[] = [];
  previewMode = false;
  previewData: CsvImportResponse | null = null;
  previewColumns: string[] = [];

  displayedColumns = ['fileName', 'mode', 'status', 'rows', 'uploader', 'createdAt', 'actions'];

  constructor(
    private csvImportService: CsvImportService,
    private snackBar: MatSnackBar,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  onFileSelected(event: any) {
    this.selectingFile = true;
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const file = event.target.files[0];
      if (file && file.name.endsWith('.csv')) {
        this.selectedFile = file;
        this.snackBar.open(`File selected: ${file.name} (${this.formatFileSize(file.size)})`, 'Close', {
          duration: 3000,
        });
      } else if (file) {
        this.snackBar.open('Please select a valid CSV file', 'Close', {
          duration: 3000,
        });
      }
      this.selectingFile = false;
      // Reset input to allow selecting same file again
      event.target.value = '';
    }, 100);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
          const result = response.data;
          this.snackBar.open(
            `Preview Complete! Total: ${result.totalRows}, Valid: ${result.successRows}, Errors: ${result.failedRows}`,
            'Close',
            { duration: 5000 }
          );
          
          // Show preview grid
          if (result.job?.rows && result.job.rows.length > 0) {
            this.previewData = result;
            this.previewMode = true;
            
            // Extract column names from first valid row
            const firstRow = result.job.rows.find((r) => r.rowData);
            if (firstRow?.rowData) {
              this.previewColumns = ['rowNumber', 'status', ...Object.keys(firstRow.rowData)];
            }
          }
          
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

  closePreview() {
    this.previewMode = false;
    this.previewData = null;
    this.previewColumns = [];
    this.clearFile();
  }

  getRowValue(row: any, column: string): string {
    if (column === 'rowNumber') return row.rowNumber;
    if (column === 'status') return row.success ? '✓' : '✗';
    return row.rowData?.[column] || '-';
  }

  commit() {
    if (!this.selectedFile) return;

    const validCount = this.previewData?.successRows || 0;
    
    // Don't allow import if no valid rows
    if (this.previewMode && validCount === 0) {
      this.snackBar.open('No valid rows to import. Please fix errors in your CSV file.', 'Close', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const message = this.previewMode 
      ? `Import ${validCount} valid rows? This will create tasks in the database.`
      : 'Are you sure you want to import this file? This will create tasks in the database.';

    this.dialogService.confirm({
      title: 'Confirm Import',
      message: message,
      confirmText: 'Import',
      cancelText: 'Cancel',
      isDanger: false
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.uploading = true;
      this.csvImportService.importCsv(this.selectedFile!, 'commit').subscribe({
        next: (response) => {
          this.uploading = false;
          if (response.success && response.data) {
            const result = response.data;
            this.snackBar.open(
              `Import Complete! ${result.successRows} tasks created successfully. Total: ${result.totalRows}, Errors: ${result.failedRows}`,
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
            this.closePreview();
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
