import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppLayoutComponent } from './core/layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/auth/callback/callback.component').then(
        (m) => m.CallbackComponent
      ),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then(
            (m) => m.TaskListComponent
          ),
      },
      {
        path: 'tasks/new',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'REVIEWER'] },
        loadComponent: () =>
          import('./features/tasks/task-create/task-create.component').then(
            (m) => m.TaskCreateComponent
          ),
      },
      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./features/tasks/task-detail/task-detail.component').then(
            (m) => m.TaskDetailComponent
          ),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'REVIEWER'] },
        loadComponent: () =>
          import('./features/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'admin/settings',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'admin/settings/sharepoint',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/settings/sharepoint-settings.component').then(
            (m) => m.SharePointSettingsComponent
          ),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/users/users.component').then(
            (m) => m.UsersComponent
          ),
      },
      {
        path: 'admin/master-data',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/master-data/master-data.component').then(
            (m) => m.MasterDataComponent
          ),
      },
      {
        path: 'admin/import',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/csv-import/csv-import.component').then(
            (m) => m.CsvImportComponent
          ),
      },
      {
        path: 'admin/teams-config',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/teams-config/teams-config.component').then(
            (m) => m.TeamsConfigComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
