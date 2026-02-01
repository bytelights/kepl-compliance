import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MasterDataService } from '../../../core/services/master-data.service';
import { Entity, Department, Law } from '../../../core/models';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './master-data.component.html',
  styleUrls: ['./master-data.component.css'],
})
export class MasterDataComponent implements OnInit {
  entities: Entity[] = [];
  departments: Department[] = [];
  laws: Law[] = [];

  newEntity = '';
  newDepartment = '';
  newLaw = '';

  constructor(
    private masterDataService: MasterDataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.masterDataService.getEntities().subscribe({
      next: (response) => {
        if (response.success && response.data) this.entities = response.data;
      },
    });

    this.masterDataService.getDepartments().subscribe({
      next: (response) => {
        if (response.success && response.data) this.departments = response.data;
      },
    });

    this.masterDataService.getLaws().subscribe({
      next: (response) => {
        if (response.success && response.data) this.laws = response.data;
      },
    });
  }

  addEntity() {
    if (!this.newEntity) return;

    this.masterDataService.createEntity({ name: this.newEntity }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Entity added successfully', 'Close', { duration: 3000 });
          this.newEntity = '';
          this.loadAll();
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to add entity: ' + (error.error?.message || 'Unknown error'), 'Close', {
          duration: 5000,
        });
      },
    });
  }

  deleteEntity(entity: Entity) {
    if (confirm(`Delete entity "${entity.name}"? This will affect all related tasks.`)) {
      this.masterDataService.deleteEntity(entity.id).subscribe({
        next: () => {
          this.snackBar.open('Entity deleted successfully', 'Close', { duration: 3000 });
          this.loadAll();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete entity: ' + (error.error?.message || 'Unknown error'), 'Close', {
            duration: 5000,
          });
        },
      });
    }
  }

  addDepartment() {
    if (!this.newDepartment) return;

    this.masterDataService.createDepartment({ name: this.newDepartment }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Department added successfully', 'Close', { duration: 3000 });
          this.newDepartment = '';
          this.loadAll();
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to add department: ' + (error.error?.message || 'Unknown error'), 'Close', {
          duration: 5000,
        });
      },
    });
  }

  deleteDepartment(dept: Department) {
    if (confirm(`Delete department "${dept.name}"? This will affect all related tasks.`)) {
      this.masterDataService.deleteDepartment(dept.id).subscribe({
        next: () => {
          this.snackBar.open('Department deleted successfully', 'Close', { duration: 3000 });
          this.loadAll();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete department: ' + (error.error?.message || 'Unknown error'), 'Close', {
            duration: 5000,
          });
        },
      });
    }
  }

  addLaw() {
    if (!this.newLaw) return;

    this.masterDataService.createLaw({ name: this.newLaw }).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Law added successfully', 'Close', { duration: 3000 });
          this.newLaw = '';
          this.loadAll();
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to add law: ' + (error.error?.message || 'Unknown error'), 'Close', {
          duration: 5000,
        });
      },
    });
  }

  deleteLaw(law: Law) {
    if (confirm(`Delete law "${law.name}"? This will affect all related tasks.`)) {
      this.masterDataService.deleteLaw(law.id).subscribe({
        next: () => {
          this.snackBar.open('Law deleted successfully', 'Close', { duration: 3000 });
          this.loadAll();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete law: ' + (error.error?.message || 'Unknown error'), 'Close', {
            duration: 5000,
          });
        },
      });
    }
  }
}
