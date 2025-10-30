import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { LoginComponent } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { 
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
                data: { breadcrumb: 'Dashboard' }
            },
            { 
                path: 'clients',
                loadComponent: () => import('./features/clients/clients').then(m => m.ClientsComponent),
                data: { breadcrumb: 'Clients' }
            },
            { 
                path: 'environments-admin',
                loadComponent: () => import('./features/environments-admin/environments-admin').then(m => m.EnvironmentsAdminComponent),
                data: { breadcrumb: 'Environments' }
            },
            { 
                path: 'connections',
                loadComponent: () => import('./features/connections/connections').then(m => m.ConnectionsComponent),
                data: { breadcrumb: 'Connections' }
            },
            { 
                path: 'tasks',
                loadComponent: () => import('./features/tasks/tasks').then(m => m.TasksComponent),
                data: { breadcrumb: 'Tasks' }
            },
            { 
                path: 'process',
                loadComponent: () => import('./features/process/process').then(m => m.ProcessComponent),
                data: { breadcrumb: 'Process' }
            },
            { 
                path: 'process/:id',
                loadComponent: () => import('./features/process/process-detail').then(m => m.ProcessDetailComponent),
                data: { breadcrumb: 'Process Detail' } // Add breadcrumb data
            },
            { 
                path: 'external-provider',
                loadComponent: () => import('./features/external-provider/external-provider').then(m => m.ExternalProviderComponent),
                data: { breadcrumb: 'External Provider' }
            },
        ]
    },
    // The route below has been moved inside the MainLayoutComponent's children
    // {
    //     path: 'process/:id',
    //     loadComponent: () => import('./features/process/process-detail').then(m => m.ProcessDetailComponent),
    //     canActivate: [authGuard]
    // },
    { path: '**', redirectTo: 'dashboard' }
];
