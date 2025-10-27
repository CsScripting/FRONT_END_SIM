import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { TasksComponent } from './features/tasks/tasks';
import { ProcessComponent } from './features/process/process';
import { ExternalProviderComponent } from './features/external-provider/external-provider';
import { ClientsComponent } from './features/clients/clients';
import { EnvironmentsAdminComponent } from './features/environments-admin/environments-admin';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { breadcrumb: 'Home' },
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { breadcrumb: 'Active Connections' } },
      { path: 'tasks', component: TasksComponent, data: { breadcrumb: 'Tasks' } },
      { path: 'process', component: ProcessComponent, data: { breadcrumb: 'Process' } },
      { path: 'external-provider', component: ExternalProviderComponent, data: { breadcrumb: 'External Provider' } },

      // Admin routes - consider adding a staffGuard here later
      { path: 'clients', component: ClientsComponent, data: { breadcrumb: 'Clients' } },
      { path: 'environments-admin', component: EnvironmentsAdminComponent, data: { breadcrumb: 'Environments' } },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' } // Redirect any other path to the default guarded route
];
