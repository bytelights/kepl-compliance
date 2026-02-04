import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Entity, Department, Law } from '../../../core/models';

interface DialogData {
  type: 'entity' | 'department' | 'law';
  item: Entity | Department | Law;
}

@Component({
  selector: 'app-edit-master-data-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>Edit {{ getTitle() }}</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="editedItem.name" required>
        </mat-form-field>

        <ng-container *ngIf="data.type === 'entity'">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Country</mat-label>
            <input matInput [(ngModel)]="entityItem.country">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>City</mat-label>
            <input matInput [(ngModel)]="entityItem.city">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Address</mat-label>
            <input matInput [(ngModel)]="entityItem.address">
          </mat-form-field>

          <mat-slide-toggle [(ngModel)]="entityItem.isActive" color="primary">
            <span class="toggle-label">Active</span>
          </mat-slide-toggle>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!editedItem.name">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .toggle-label {
      font-size: 14px;
      font-weight: 500;
      color: #2c3e50;
      margin-left: 8px;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class EditMasterDataDialogComponent {
  editedItem: any;
  entityItem: any;

  constructor(
    public dialogRef: MatDialogRef<EditMasterDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.editedItem = { ...data.item };
    this.entityItem = data.type === 'entity' ? { ...data.item } : {};
  }

  getTitle(): string {
    switch (this.data.type) {
      case 'entity': return 'Entity';
      case 'department': return 'Department';
      case 'law': return 'Law';
      default: return 'Item';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.data.type === 'entity') {
      this.dialogRef.close(this.entityItem);
    } else {
      this.dialogRef.close({ name: this.editedItem.name });
    }
  }
}
