import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  // Add other routes here, protected by AuthGuard
  // { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  // { path: 'forbidden', component: ForbiddenComponent },
  // { path: '**', redirectTo: '/login' } // Wildcard route for 404 - redirect to login
];
