import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // TODO: Add logic to check permissions based on the route
          // const requiredProcess = route.data['processId'];
          // if (requiredProcess && !this.authService.hasAccessToProcess(requiredProcess)) {
          //   return this.router.createUrlTree(['/forbidden']);
          // }
          return true;
        } else {
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
