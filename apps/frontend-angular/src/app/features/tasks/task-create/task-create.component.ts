import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { UserService } from '../../../core/services/user.service';
import { Entity, Department, Law, User } from '../../../core/models';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatToolbarModule,
  ],
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.css'],
})
export class TaskCreateComponent implements OnInit {
  taskForm: FormGroup;
  
  entities: Entity[] = [];
  departments: Department[] = [];
  laws: Law[] = [];
  users: User[] = [];
  complianceMasters: any[] = [];
  
  loading = true;
  submitting = false;

  frequencies = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'HALF_YEARLY', label: 'Half Yearly' },
    { value: 'YEARLY', label: 'Yearly' },
    { value: 'ONE_TIME', label: 'One Time' },
  ];

  impacts = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private masterDataService: MasterDataService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.taskForm = this.fb.group({
      complianceMasterId: [null],
      complianceId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      entityId: ['', Validators.required],
      departmentId: ['', Validators.required],
      lawId: ['', Validators.required],
      ownerId: ['', Validators.required],
      reviewerId: ['', Validators.required],
      frequency: [null],
      impact: [null],
      dueDate: [null],
    });
  }

  ngOnInit() {
    this.loadFormData();
  }

  loadFormData() {
    this.loading = true;

    // Load all master data and users in parallel
    Promise.all([
      this.loadEntities(),
      this.loadDepartments(),
      this.loadLaws(),
      this.loadUsers(),
      this.loadComplianceMasters(),
    ]).then(() => {
      this.loading = false;
    });
  }

  loadEntities(): Promise<void> {
    return new Promise((resolve) => {
      this.masterDataService.getEntities().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.entities = response.data;
          }
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  loadDepartments(): Promise<void> {
    return new Promise((resolve) => {
      this.masterDataService.getDepartments().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.departments = response.data;
          }
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  loadLaws(): Promise<void> {
    return new Promise((resolve) => {
      this.masterDataService.getLaws().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.laws = response.data;
          }
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  loadUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.userService.getUsers().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.users = response.data;
          }
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  loadComplianceMasters(): Promise<void> {
    return new Promise((resolve) => {
      this.masterDataService.getCompliances().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.complianceMasters = response.data;
          }
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  onMasterSelected(masterId: string) {
    if (!masterId) {
      // Clear auto-filled fields if master deselected
      this.taskForm.patchValue({
        title: '',
        description: '',
        lawId: '',
        departmentId: '',
        frequency: null,
        impact: null,
      });
      return;
    }

    const master = this.complianceMasters.find(m => m.id === masterId);
    if (master) {
      // Auto-fill from master template
      this.taskForm.patchValue({
        title: master.title,
        description: master.description || '',
        lawId: master.lawId,
        departmentId: master.departmentId,
        frequency: master.frequency,
        impact: master.impact,
      });

      this.snackBar.open('Template applied successfully', 'Close', {
        duration: 2000,
      });
    }
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.submitting = true;
    const formValue = this.taskForm.value;

    // Remove complianceMasterId if empty
    const taskData = {
      ...formValue,
      complianceMasterId: formValue.complianceMasterId || undefined,
    };

    this.taskService.createTask(taskData).subscribe({
      next: (response) => {
        if (response.success && response.data?.id) {
          this.snackBar.open('Task created successfully', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/tasks', response.data.id]);
        }
        this.submitting = false;
      },
      error: (error) => {
        this.snackBar.open(
          'Failed to create task: ' + (error.error?.message || error.message),
          'Close',
          { duration: 5000 }
        );
        this.submitting = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/tasks']);
  }
}
