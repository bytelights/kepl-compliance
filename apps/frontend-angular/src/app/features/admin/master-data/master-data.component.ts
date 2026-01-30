import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MasterDataService } from '../../../core/services/master-data.service';
import { Entity, Department, Law, ComplianceMaster } from '../../../core/models';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="master-data-container">
      <div class="header">
        <h1>Master Data Management</h1>
      </div>

      <mat-card>
        <mat-tab-group>
          <!-- Entities Tab -->
          <mat-tab label="Entities">
            <div class="tab-content">
              <div class="add-form">
                <mat-form-field>
                  <mat-label>Entity Name</mat-label>
                  <input matInput [(ngModel)]="newEntity" placeholder="Enter entity name">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="addEntity()" [disabled]="!newEntity">
                  <mat-icon>add</mat-icon>
                  Add Entity
                </button>
              </div>

              <table mat-table [dataSource]="entities" *ngIf="entities.length">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.name }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let item">
                    <button mat-icon-button color="warn" (click)="deleteEntity(item)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['name', 'actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'actions']"></tr>
              </table>
            </div>
          </mat-tab>

          <!-- Departments Tab -->
          <mat-tab label="Departments">
            <div class="tab-content">
              <div class="add-form">
                <mat-form-field>
                  <mat-label>Department Name</mat-label>
                  <input matInput [(ngModel)]="newDepartment" placeholder="Enter department name">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="addDepartment()" [disabled]="!newDepartment">
                  <mat-icon>add</mat-icon>
                  Add Department
                </button>
              </div>

              <table mat-table [dataSource]="departments" *ngIf="departments.length">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.name }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let item">
                    <button mat-icon-button color="warn" (click)="deleteDepartment(item)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['name', 'actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'actions']"></tr>
              </table>
            </div>
          </mat-tab>

          <!-- Laws Tab -->
          <mat-tab label="Laws">
            <div class="tab-content">
              <div class="add-form">
                <mat-form-field>
                  <mat-label>Law Name</mat-label>
                  <input matInput [(ngModel)]="newLaw" placeholder="Enter law name">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="addLaw()" [disabled]="!newLaw">
                  <mat-icon>add</mat-icon>
                  Add Law
                </button>
              </div>

              <table mat-table [dataSource]="laws" *ngIf="laws.length">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let item">{{ item.name }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let item">
                    <button mat-icon-button color="warn" (click)="deleteLaw(item)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['name', 'actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'actions']"></tr>
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .master-data-container {
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

      .tab-content {
        padding: 24px 0;
      }

      .add-form {
        display: flex;
        gap: 16px;
        align-items: center;
        margin-bottom: 24px;
      }

      .add-form mat-form-field {
        flex: 1;
      }

      table {
        width: 100%;
      }
    `,
  ],
})
export class MasterDataComponent implements OnInit {
  entities: Entity[] = [];
  departments: Department[] = [];
  laws: Law[] = [];

  newEntity = '';
  newDepartment = '';
  newLaw = '';

  constructor(private masterDataService: MasterDataService) {}

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
    this.masterDataService.createEntity({ name: this.newEntity }).subscribe({
      next: (response) => {
        if (response.success) {
          this.newEntity = '';
          this.loadAll();
        }
      },
    });
  }

  deleteEntity(entity: Entity) {
    if (confirm(`Delete entity "${entity.name}"?`)) {
      this.masterDataService.deleteEntity(entity.id).subscribe({
        next: () => this.loadAll(),
      });
    }
  }

  addDepartment() {
    this.masterDataService.createDepartment({ name: this.newDepartment }).subscribe({
      next: (response) => {
        if (response.success) {
          this.newDepartment = '';
          this.loadAll();
        }
      },
    });
  }

  deleteDepartment(dept: Department) {
    if (confirm(`Delete department "${dept.name}"?`)) {
      this.masterDataService.deleteDepartment(dept.id).subscribe({
        next: () => this.loadAll(),
      });
    }
  }

  addLaw() {
    this.masterDataService.createLaw({ name: this.newLaw }).subscribe({
      next: (response) => {
        if (response.success) {
          this.newLaw = '';
          this.loadAll();
        }
      },
    });
  }

  deleteLaw(law: Law) {
    if (confirm(`Delete law "${law.name}"?`)) {
      this.masterDataService.deleteLaw(law.id).subscribe({
        next: () => this.loadAll(),
      });
    }
  }
}
