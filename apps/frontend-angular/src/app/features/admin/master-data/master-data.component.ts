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
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MasterDataService } from '../../../core/services/master-data.service';
import { Entity, Department, Law, ComplianceMaster } from '../../../core/models';
import { DialogService } from '../../../shared/services/dialog.service';

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
    MatSelectModule,
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
  complianceTemplates: ComplianceMaster[] = [];

  newEntity = '';
  newDepartment = '';
  newLaw = '';
  newTemplate: Partial<ComplianceMaster> = {};
  editingTemplate: ComplianceMaster | null = null;

  constructor(
    private masterDataService: MasterDataService,
    private snackBar: MatSnackBar,
    private dialogService: DialogService
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

    this.masterDataService.getCompliances().subscribe({
      next: (response) => {
        if (response.success && response.data) this.complianceTemplates = response.data;
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
    this.dialogService.confirm({
      title: 'Delete Entity',
      message: `Delete entity "${entity.name}"? This will affect all related tasks.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;

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
    });
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
    this.dialogService.confirm({
      title: 'Delete Department',
      message: `Delete department "${dept.name}"? This will affect all related tasks.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;

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
    });
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
    this.dialogService.confirm({
      title: 'Delete Law',
      message: `Delete law "${law.name}"? This will affect all related tasks.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;

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
    });
  }

  // ========== COMPLIANCE TEMPLATES ==========
  isTemplateValid(): boolean {
    return !!(
      this.newTemplate.name?.trim() &&
      this.newTemplate.complianceId?.trim() &&
      this.newTemplate.title?.trim() &&
      this.newTemplate.lawId &&
      this.newTemplate.departmentId
    );
  }

  saveTemplate() {
    if (!this.isTemplateValid()) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    if (this.editingTemplate) {
      // Update existing template
      this.masterDataService.updateCompliance(this.editingTemplate.id, this.newTemplate).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Template updated successfully', 'Close', { duration: 3000 });
            this.loadAll();
            this.cancelEditTemplate();
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to update template: ' + (error.error?.message || 'Unknown error'), 'Close', {
            duration: 5000,
          });
        },
      });
    } else {
      // Create new template
      this.masterDataService.createCompliance(this.newTemplate).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Template created successfully', 'Close', { duration: 3000 });
            this.loadAll();
            this.newTemplate = {};
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to create template: ' + (error.error?.message || 'Unknown error'), 'Close', {
            duration: 5000,
          });
        },
      });
    }
  }

  editTemplate(template: ComplianceMaster) {
    this.editingTemplate = template;
    this.newTemplate = {
      name: template.name,
      complianceId: template.complianceId,
      title: template.title,
      description: template.description,
      lawId: template.lawId,
      departmentId: template.departmentId,
      frequency: template.frequency,
      impact: template.impact,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditTemplate() {
    this.editingTemplate = null;
    this.newTemplate = {};
  }

  deleteTemplate(template: ComplianceMaster) {
    this.dialogService.confirm({
      title: 'Delete Template',
      message: `Delete template "${template.name}"? This will not affect existing tasks.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.masterDataService.deleteCompliance(template.id).subscribe({
        next: () => {
          this.snackBar.open('Template deleted successfully', 'Close', { duration: 3000 });
          this.loadAll();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete template: ' + (error.error?.message || 'Unknown error'), 'Close', {
            duration: 5000,
          });
        },
      });
    });
  }
}
