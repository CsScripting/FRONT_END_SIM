import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { signal } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { JwtPayload } from '../../core/services/jwt-helper.service';
import { Breadcrumb, BreadcrumbService } from '../../core/services/breadcrumb.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayoutComponent {
  currentUser$: Observable<JwtPayload | null>;
  breadcrumbs$: Observable<Breadcrumb[]>;

  isSidebarCollapsed = signal(false);
  isUserMenuVisible = signal(false);
  isConfigurationMenuOpen = signal(false);
  
  constructor(
    private authService: AuthService, 
    private router: Router,
    private breadcrumbService: BreadcrumbService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.breadcrumbs$ = this.breadcrumbService.breadcrumbs$;
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
