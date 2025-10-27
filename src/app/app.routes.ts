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
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'tasks', component: TasksComponent },
      { path: 'process', component: ProcessComponent },
      { path: 'external-provider', component: ExternalProviderComponent },

      // Admin routes - consider adding a staffGuard here later
      { path: 'clients', component: ClientsComponent },
      { path: 'environments-admin', component: EnvironmentsAdminComponent },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' } // Redirect any other path to the default guarded route
];
