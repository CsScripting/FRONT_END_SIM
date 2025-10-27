import { Component, signal, HostListener, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { JwtPayload } from '../../core/services/jwt-helper.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  isSidebarCollapsed = signal(false);
  isUserMenuVisible = signal(false);
  currentUser$: Observable<JwtPayload | null>;

  constructor(private authService: AuthService, private elementRef: ElementRef) {
    this.currentUser$ = this.authService.currentUser$;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuVisible.set(false);
    }
  }

  toggleSidebar(event: MouseEvent): void {
    event.preventDefault();
    console.log('Toggling sidebar...');
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
    console.log('Sidebar collapsed state:', this.isSidebarCollapsed());
  }
  
  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation(); // Prevents the document click listener from firing immediately
    this.isUserMenuVisible.set(!this.isUserMenuVisible());
  }

  changePassword(): void {
    console.log('Change password clicked');
    this.isUserMenuVisible.set(false);
  }

  seeProfile(): void {
    console.log('See profile clicked');
    this.isUserMenuVisible.set(false);
  }

  logout(): void {
    this.isUserMenuVisible.set(false);
    this.authService.logout();
  }
}
