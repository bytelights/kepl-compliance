import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-skip-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="skip-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="title-icon">block</mat-icon>
        Skip Task
      </h2>
      <mat-dialog-content>
        <p class="dialog-message">
          Skipping this task will mark it as not applicable. Please provide a reason for skipping.
        </p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason for Skipping (Required)</mat-label>
          <textarea
            matInput
            [(ngModel)]="skipRemarks"
            rows="4"
            placeholder="Enter the reason why this task is being skipped..."
            required
          ></textarea>
          <mat-hint>This will be recorded for audit purposes</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button
          mat-raised-button
          color="warn"
          (click)="onSkip()"
          [disabled]="!skipRemarks || !skipRemarks.trim()"
        >
          <mat-icon>block</mat-icon>
          Skip Task
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .skip-dialog {
      min-width: 400px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #d32f2f;
      margin: 0;
    }

    .title-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    mat-dialog-content {
      padding: 20px 24px;
    }

    .dialog-message {
      margin-bottom: 20px;
      color: #666;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 12px;
    }

    mat-dialog-actions button {
      min-width: 100px;
    }
  `],
})
export class SkipTaskDialogComponent {
  skipRemarks = '';

  constructor(private dialogRef: MatDialogRef<SkipTaskDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSkip(): void {
    if (this.skipRemarks && this.skipRemarks.trim()) {
      this.dialogRef.close(this.skipRemarks.trim());
    }
  }
}
