import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ComplianceTask } from '../../../core/models';
import { SkipTaskDialogComponent } from '../../../shared/components/skip-task-dialog/skip-task-dialog.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css'],
})
export class TaskDetailComponent implements OnInit {
  task: ComplianceTask | null = null;
  loading = true;
  completeComment = '';
  skipRemarks = '';
  selectedFiles: File[] = [];

  get canExecuteTask(): boolean {
    return this.task?.status === 'PENDING' && this.authService.isTaskOwner();
  }

  get canUploadEvidence(): boolean {
    return this.task?.status === 'PENDING';
  }

  getLatestExecution() {
    if (!this.task || !this.task.taskExecutions || this.task.taskExecutions.length === 0) {
      return null;
    }
    // Return the most recent execution (already sorted by executedAt desc)
    return this.task.taskExecutions[0];
  }

  getExecutionRemarks(): string | undefined {
    const execution = this.getLatestExecution();
    return execution?.remarks || execution?.comment;
  }

  getExecutionLabel(): string {
    const execution = this.getLatestExecution();
    if (!execution) return 'Remarks';
    
    switch (execution.action) {
      case 'SKIP':
        return 'Reason for Skipping';
      case 'COMPLETE':
        return 'Completion Comments';
      default:
        return 'Remarks';
    }
  }

  getExecutionIcon(): string {
    const execution = this.getLatestExecution();
    if (!execution) return 'comment';
    
    switch (execution.action) {
      case 'SKIP':
        return 'block';
      case 'COMPLETE':
        return 'check_circle';
      default:
        return 'comment';
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogService: DialogService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTask(id);
    }
  }

  loadTask(id: string) {
    this.loading = true;
    this.taskService.getTask(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.task = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/tasks']);
      },
    });
  }

  isOverdue(): boolean {
    if (!this.task?.dueDate || this.task?.status !== 'PENDING') return false;
    return new Date(this.task.dueDate) < new Date();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onEvidenceFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      this.snackBar.open(`${newFiles.length} file(s) added. Total: ${this.selectedFiles.length}`, 'Close', {
        duration: 3000
      });
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }

  removeSelectedFile(index: number): void {
    const fileName = this.selectedFiles[index].name;
    this.selectedFiles.splice(index, 1);
    this.snackBar.open(`Removed ${fileName}`, 'Close', { duration: 2000 });
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getFilePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  getFileExtension(file: File): string {
    const name = file.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot > 0 ? name.substring(lastDot + 1).toUpperCase() : 'FILE';
  }

  getFileIcon(file: File): string {
    const ext = this.getFileExtension(file).toLowerCase();
    const iconMap: Record<string, string> = {
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'xls': 'table_chart',
      'xlsx': 'table_chart',
      'ppt': 'slideshow',
      'pptx': 'slideshow',
      'txt': 'text_snippet',
      'csv': 'table_view',
      'zip': 'folder_zip',
      'rar': 'folder_zip',
    };
    return iconMap[ext] || 'insert_drive_file';
  }

  completeTask() {
    if (!this.task || !this.completeComment) return;
    
    // Check if files are selected or already uploaded
    const hasEvidence = this.selectedFiles.length > 0 || (this.task.evidenceFiles?.length || 0) > 0;
    if (!hasEvidence) {
      this.snackBar.open('Please select at least one evidence file before completing the task', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.dialogService.confirm({
      title: 'Complete Task',
      message: `Are you sure you want to mark this task as complete?${this.selectedFiles.length > 0 ? ` This will upload ${this.selectedFiles.length} file(s) to SharePoint.` : ''}`,
      confirmText: 'Complete',
      cancelText: 'Cancel',
    }).subscribe(confirmed => {
      if (confirmed && this.task) {
        // If new files are selected, upload them first
        if (this.selectedFiles.length > 0) {
          this.uploadFilesToSharePoint().then(() => {
            this.completeTaskAfterUpload();
          }).catch((error) => {
            this.snackBar.open('Failed to upload evidence files: ' + (error?.message || 'Unknown error'), 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          });
        } else {
          // No new files, just complete the task
          this.completeTaskAfterUpload();
        }
      }
    });
  }

  private async uploadFilesToSharePoint(): Promise<void> {
    if (!this.task) return;

    // TODO: Implement SharePoint upload API call
    // For now, we'll simulate the upload
    return new Promise((resolve, reject) => {
      this.snackBar.open('Uploading files to SharePoint...', '', { duration: 2000 });
      
      // Simulate upload delay
      setTimeout(() => {
        // TODO: Replace with actual API call to upload files
        // this.taskService.uploadEvidence(this.task.id, this.selectedFiles).subscribe(...)
        resolve();
      }, 1500);
    });
  }

  private completeTaskAfterUpload(): void {
    if (!this.task) return;

    this.taskService.completeTask(this.task.id, { comment: this.completeComment }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Task completed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.selectedFiles = [];
          this.loadTask(this.task!.id);
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to complete task: ' + (error.error?.message || 'Unknown error'), 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      },
    });
  }

  openSkipDialog() {
    const dialogRef = this.dialog.open(SkipTaskDialogComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((skipRemarks: string) => {
      if (skipRemarks && this.task) {
        this.taskService.skipTask(this.task.id, { remarks: skipRemarks }).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Task skipped successfully!', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadTask(this.task!.id);
            }
          },
          error: (error) => {
            this.snackBar.open('Failed to skip task: ' + (error.error?.message || 'Unknown error'), 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          },
        });
      }
    });
  }
}
