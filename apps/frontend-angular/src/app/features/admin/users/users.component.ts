import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  editingUser: User | null = null;
  newRole = '';

  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

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
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
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
          this.snackBar.open('User role updated successfully', 'Close', {
            duration: 3000,
          });
          this.loadUsers();
          this.cancelEdit();
        }
      },
      error: (error) => {
        this.snackBar.open(
          'Failed to update user role: ' + (error.error?.message || 'Unknown error'),
          'Close',
          { duration: 5000 }
        );
      },
    });
  }
}
