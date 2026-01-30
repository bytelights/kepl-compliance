import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/task-list/task-list.component').then(
        (m) => m.TaskListComponent
      ),
  },
  {
    path: 'tasks/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'REVIEWER'] },
    loadComponent: () =>
      import('./features/tasks/task-create/task-create.component').then(
        (m) => m.TaskCreateComponent
      ),
  },
  {
    path: 'tasks/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/task-detail/task-detail.component').then(
        (m) => m.TaskDetailComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then(
            (m) => m.UsersComponent
          ),
      },
      {
        path: 'master-data',
        loadComponent: () =>
          import('./features/admin/master-data/master-data.component').then(
            (m) => m.MasterDataComponent
          ),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/admin/csv-import/csv-import.component').then(
            (m) => m.CsvImportComponent
          ),
      },
      {
        path: 'teams-config',
        loadComponent: () =>
          import('./features/admin/teams-config/teams-config.component').then(
            (m) => m.TeamsConfigComponent
          ),
      },
    ],
  },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'REVIEWER'] },
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
