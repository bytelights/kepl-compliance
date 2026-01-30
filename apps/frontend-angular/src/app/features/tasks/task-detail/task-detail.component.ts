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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { ComplianceTask } from '../../core/models';

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
  ],
  template: `
    <div class="task-detail-container">
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!loading && task" class="task-content">
        <!-- Header -->
        <div class="header">
          <button mat-icon-button routerLink="/tasks">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ task.complianceId }} - {{ task.title }}</h1>
          <mat-chip [class]="'status-' + task.status">{{ task.status }}</mat-chip>
        </div>

        <!-- Task Details -->
        <mat-card class="details-card">
          <mat-card-header>
            <mat-card-title>Task Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="details-grid">
              <div class="detail-item">
                <label>Entity:</label>
                <span>{{ task.entity?.name }}</span>
              </div>
              <div class="detail-item">
                <label>Department:</label>
                <span>{{ task.department?.name }}</span>
              </div>
              <div class="detail-item">
                <label>Law:</label>
                <span>{{ task.law?.name }}</span>
              </div>
              <div class="detail-item">
                <label>Frequency:</label>
                <span>{{ task.frequency }}</span>
              </div>
              <div class="detail-item">
                <label>Impact:</label>
                <span>
                  <mat-chip [class]="'impact-' + task.impact">{{ task.impact || 'N/A' }}</mat-chip>
                </span>
              </div>
              <div class="detail-item">
                <label>Due Date:</label>
                <span [class.overdue]="isOverdue()">
                  {{ task.dueDate | date: 'MMM d, y' }}
                </span>
              </div>
              <div class="detail-item">
                <label>Owner:</label>
                <span>{{ task.owner?.name }}</span>
              </div>
              <div class="detail-item">
                <label>Reviewer:</label>
                <span>{{ task.reviewer?.name }}</span>
              </div>
            </div>

            <div *ngIf="task.description" class="description">
              <label>Description:</label>
              <p>{{ task.description }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Evidence Files -->
        <mat-card class="evidence-card">
          <mat-card-header>
            <mat-card-title>Evidence Files</mat-card-title>
            <button mat-raised-button color="primary" *ngIf="canUploadEvidence">
              <mat-icon>upload</mat-icon>
              Upload Evidence
            </button>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="!task.evidenceFiles?.length" class="empty-state">
              <mat-icon>cloud_upload</mat-icon>
              <p>No evidence files uploaded</p>
            </div>

            <div *ngIf="task.evidenceFiles?.length" class="evidence-list">
              <div *ngFor="let file of task.evidenceFiles" class="evidence-item">
                <mat-icon>description</mat-icon>
                <div class="file-info">
                  <div class="file-name">{{ file.fileName }}</div>
                  <div class="file-meta">
                    {{ file.fileSize | number }} bytes • {{ file.uploadedAt | date: 'short' }}
                  </div>
                </div>
                <a mat-icon-button [href]="file.sharepointWebUrl" target="_blank" matTooltip="View">
                  <mat-icon>open_in_new</mat-icon>
                </a>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Actions -->
        <mat-card class="actions-card" *ngIf="task.status === 'PENDING' && canExecuteTask">
          <mat-card-header>
            <mat-card-title>Task Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-section">
              <h3>Complete Task</h3>
              <mat-form-field class="full-width">
                <mat-label>Comment (required)</mat-label>
                <textarea
                  matInput
                  rows="3"
                  [(ngModel)]="completeComment"
                  placeholder="Enter completion comment..."
                ></textarea>
              </mat-form-field>
              <button
                mat-raised-button
                color="primary"
                (click)="completeTask()"
                [disabled]="!completeComment || !task.evidenceFiles?.length"
              >
                <mat-icon>check_circle</mat-icon>
                Complete Task
              </button>
              <p class="hint" *ngIf="!task.evidenceFiles?.length">
                * At least one evidence file is required to complete the task
              </p>
            </div>

            <div class="action-section">
              <h3>Skip Task</h3>
              <mat-form-field class="full-width">
                <mat-label>Remarks (required)</mat-label>
                <textarea
                  matInput
                  rows="3"
                  [(ngModel)]="skipRemarks"
                  placeholder="Enter reason for skipping..."
                ></textarea>
              </mat-form-field>
              <button
                mat-raised-button
                color="warn"
                (click)="skipTask()"
                [disabled]="!skipRemarks"
              >
                <mat-icon>skip_next</mat-icon>
                Skip Task
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Completion Info -->
        <mat-card *ngIf="task.status === 'COMPLETED'" class="completion-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>check_circle</mat-icon>
              Task Completed
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Completed At:</strong> {{ task.completedAt | date: 'medium' }}</p>
          </mat-card-content>
        </mat-card>

        <mat-card *ngIf="task.status === 'SKIPPED'" class="skipped-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>skip_next</mat-icon>
              Task Skipped
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Skipped At:</strong> {{ task.skippedAt | date: 'medium' }}</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .task-detail-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 48px;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .header h1 {
        flex: 1;
        margin: 0;
        font-size: 24px;
      }

      .details-card,
      .evidence-card,
      .actions-card,
      .completion-card,
      .skipped-card {
        margin-bottom: 24px;
      }

      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .detail-item label {
        font-weight: 500;
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
      }

      .detail-item span {
        font-size: 16px;
      }

      .description {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
      }

      .description label {
        font-weight: 500;
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
      }

      .overdue {
        color: #f44336;
        font-weight: 500;
      }

      .status-PENDING {
        background-color: #ff9800 !important;
        color: white !important;
      }

      .status-COMPLETED {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .status-SKIPPED {
        background-color: #9e9e9e !important;
        color: white !important;
      }

      .impact-HIGH {
        background-color: #f44336 !important;
        color: white !important;
      }

      .impact-MEDIUM {
        background-color: #ff9800 !important;
        color: white !important;
      }

      .impact-LOW {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .empty-state {
        text-align: center;
        padding: 32px;
        color: #666;
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ccc;
      }

      .evidence-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .evidence-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }

      .evidence-item mat-icon:first-child {
        color: #666;
      }

      .file-info {
        flex: 1;
      }

      .file-name {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .file-meta {
        font-size: 12px;
        color: #666;
      }

      .action-section {
        margin-bottom: 32px;
      }

      .action-section:last-child {
        margin-bottom: 0;
      }

      .action-section h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
      }

      .full-width {
        width: 100%;
      }

      .hint {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: #666;
      }

      .completion-card mat-card-title,
      .skipped-card mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .completion-card mat-card-title mat-icon {
        color: #4caf50;
      }

      .skipped-card mat-card-title mat-icon {
        color: #9e9e9e;
      }
    `,
  ],
})
export class TaskDetailComponent implements OnInit {
  task: ComplianceTask | null = null;
  loading = true;
  completeComment = '';
  skipRemarks = '';

  get canExecuteTask(): boolean {
    return this.task?.status === 'PENDING' && this.authService.isTaskOwner();
  }

  get canUploadEvidence(): boolean {
    return this.task?.status === 'PENDING';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService
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

  completeTask() {
    if (!this.task || !this.completeComment) return;

    this.taskService.completeTask(this.task.id, { comment: this.completeComment }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Task completed successfully!');
          this.loadTask(this.task!.id);
        }
      },
      error: (error) => {
        alert('Failed to complete task: ' + (error.error?.message || 'Unknown error'));
      },
    });
  }

  skipTask() {
    if (!this.task || !this.skipRemarks) return;

    this.taskService.skipTask(this.task.id, { remarks: this.skipRemarks }).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Task skipped successfully!');
          this.loadTask(this.task!.id);
        }
      },
      error: (error) => {
        alert('Failed to skip task: ' + (error.error?.message || 'Unknown error'));
      },
    });
  }
}
