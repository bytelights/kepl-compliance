import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="users-container">
      <div class="header">
        <h1>User Management</h1>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>

          <div *ngIf="!loading && users.length === 0" class="empty-state">
            <mat-icon>people</mat-icon>
            <p>No users found</p>
          </div>

          <table mat-table [dataSource]="users" *ngIf="!loading && users.length > 0">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let user">{{ user.name }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="'role-' + user.role">
                  {{ getRoleLabel(user.role) }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [class]="user.isActive ? 'status-active' : 'status-inactive'">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                <button mat-button (click)="editRole(user)">
                  <mat-icon>edit</mat-icon>
                  Change Role
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Edit Role Dialog (inline) -->
      <div *ngIf="editingUser" class="edit-overlay" (click)="cancelEdit()">
        <mat-card class="edit-dialog" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>Change User Role</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p><strong>User:</strong> {{ editingUser.name }}</p>
            <p><strong>Email:</strong> {{ editingUser.email }}</p>
            
            <mat-form-field class="full-width">
              <mat-label>Role</mat-label>
              <mat-select [(ngModel)]="newRole">
                <mat-option value="admin">Admin</mat-option>
                <mat-option value="reviewer">Reviewer</mat-option>
                <mat-option value="task_owner">Task Owner</mat-option>
              </mat-select>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="cancelEdit()">Cancel</button>
            <button mat-raised-button color="primary" (click)="saveRole()">
              Save
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .users-container {
        padding: 24px;
        max-width: 1200px;
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

      .role-admin {
        background-color: #f44336 !important;
        color: white !important;
      }

      .role-reviewer {
        background-color: #2196f3 !important;
        color: white !important;
      }

      .role-task_owner {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .status-active {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .status-inactive {
        background-color: #9e9e9e !important;
        color: white !important;
      }

      .edit-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .edit-dialog {
        min-width: 400px;
        max-width: 500px;
      }

      .full-width {
        width: 100%;
        margin: 16px 0;
      }

      mat-card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  editingUser: User | null = null;
  newRole = '';

  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      reviewer: 'Reviewer',
      task_owner: 'Task Owner',
    };
    return labels[role] || role;
  }

  editRole(user: User) {
    this.editingUser = user;
    this.newRole = user.role;
  }

  cancelEdit() {
    this.editingUser = null;
    this.newRole = '';
  }

  saveRole() {
    if (!this.editingUser || !this.newRole) return;

    this.userService.updateUserRole(this.editingUser.id, this.newRole).subscribe({
      next: (response) => {
        if (response.success) {
          alert('User role updated successfully!');
          this.loadUsers();
          this.cancelEdit();
        }
      },
      error: (error) => {
        alert('Failed to update user role: ' + (error.error?.message || 'Unknown error'));
      },
    });
  }
}
