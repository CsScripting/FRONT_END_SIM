import { Component, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  
  constructor(private router: Router, private renderer: Renderer2) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects === '/login') {
        this.renderer.addClass(document.body, 'is-login-page');
      } else {
        this.renderer.removeClass(document.body, 'is-login-page');
      }
    });
  }
}
