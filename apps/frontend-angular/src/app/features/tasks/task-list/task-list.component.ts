import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { TaskService } from '../../../core/services/task.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ComplianceTask, Entity, Department, Law } from '../../../core/models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  tasks: ComplianceTask[] = [];
  entities: Entity[] = [];
  departments: Department[] = [];
  laws: Law[] = [];
  
  loading = true;
  loadingMore = false;
  totalTasks = 0;
  pageSize = 25;
  currentPage = 0;
  hasMore = true;

  filterForm: FormGroup;

  displayedColumns = [
    'complianceId',
    'title',
    'entity',
    'department',
    'law',
    'dueDate',
    'owner',
    'status',
    'actions',
  ];

  get canCreateTask(): boolean {
    return this.authService.isAdmin() || this.authService.isReviewer();
  }

  get canDeleteTask(): boolean {
    return this.authService.isAdmin();
  }

  constructor(
    private taskService: TaskService,
    private masterDataService: MasterDataService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialogService: DialogService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      entityId: [''],
      departmentId: [''],
      lawId: [''],
    });
  }

  ngOnInit() {
    this.loadMasterData();
    this.loadTasks();
  }

  loadMasterData() {
    this.masterDataService.getEntities().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.entities = response.data;
        }
      },
    });

    this.masterDataService.getDepartments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.departments = response.data;
        }
      },
    });

    this.masterDataService.getLaws().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.laws = response.data;
        }
      },
    });
  }

  loadTasks(append = false) {
    if (append) {
      this.loadingMore = true;
    } else {
      this.loading = true;
      this.currentPage = 0;
      this.tasks = [];
    }

    const filters = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      ...this.filterForm.value,
    };

    this.taskService.getTasks(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (append) {
            this.tasks = [...this.tasks, ...response.data.items];
          } else {
            this.tasks = response.data.items;
          }
          this.totalTasks = response.data.total;
          this.hasMore = this.tasks.length < this.totalTasks;
        }
        this.loading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
      },
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.loadingMore || this.loading || !this.hasMore) {
      return;
    }

    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    // Load more when user scrolls to bottom (with 100px threshold)
    if (scrollPosition >= pageHeight - 100) {
      this.currentPage++;
      this.loadTasks(true);
    }
  }

  applyFilters() {
    this.currentPage = 0;
    this.hasMore = true;
    this.loadTasks();
  }

  resetFilters() {
    this.filterForm.reset({
      search: '',
      status: '',
      entityId: '',
      departmentId: '',
      lawId: '',
    });
    this.applyFilters();
  }

  isOverdue(task: ComplianceTask): boolean {
    if (!task.dueDate || task.status !== 'PENDING') return false;
    return new Date(task.dueDate) < new Date();
  }

  onRowClick(task: ComplianceTask, event: MouseEvent) {
    // Don't navigate if clicking on actions menu
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('.mat-mdc-menu-trigger')) {
      return;
    }
    this.router.navigate(['/tasks', task.id]);
  }

  openEvidenceModal(task: ComplianceTask): void {
    // TODO: Open evidence modal with file upload and completion comment
    this.snackBar.open('Evidence modal coming soon!', 'Close', {
      duration: 3000
    });
  }

  deleteTask(task: ComplianceTask) {
    this.dialogService.confirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete task "${task.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.taskService.deleteTask(task.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Task deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadTasks();
            }
          },
          error: () => {
            this.snackBar.open('Failed to delete task', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
