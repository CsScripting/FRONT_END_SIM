import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { signal } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { JwtPayload } from '../../core/services/jwt-helper.service';
import { Breadcrumb, BreadcrumbService } from '../../core/services/breadcrumb.service';
import { EnvironmentService, CurrentSelectionState } from '../../core/services/environment.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent implements OnInit {
  currentUser$: Observable<JwtPayload | null>;
  breadcrumbs$: Observable<Breadcrumb[]>;
  persistedState$: Observable<CurrentSelectionState>;

  isSidebarCollapsed = signal(false);
  isUserMenuVisible = signal(false);
  isConfigurationMenuOpen = signal(false);
  
  constructor(
    private authService: AuthService, 
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private environmentService: EnvironmentService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
    this.persistedState$ = this.environmentService.persistedState$;
  }

  ngOnInit(): void {
    this.environmentService.loadInitialState().subscribe({
      next: () => console.log('MainLayout: Initial state loaded successfully.'),
      error: (err) => console.error('Failed to load initial environment state', err)
    });
  }

  toggleSidebar(event: Event): void {
    event.preventDefault();
    this.isSidebarCollapsed.update(value => !value);
  }

  toggleConfigurationMenu(event: Event): void {
    event.preventDefault();
    this.isConfigurationMenuOpen.update(value => !value);
  }

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    this.isUserMenuVisible.update(value => !value);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Placeholder methods for user menu actions
  changePassword(): void {
    console.log('Change password clicked');
  }

  seeProfile(): void {
    console.log('See profile clicked');
  }
}
