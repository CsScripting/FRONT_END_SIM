import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginCredentials, TokenResponse, UserPermissions } from '../models/auth.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_PERMISSIONS_KEY = 'user_permissions';
  private readonly API_URL = '/api';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidAccessToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  private hasValidAccessToken(): boolean {
    const token = this.getAccessToken();
    // Add token validation logic (expiration, etc.) if necessary
    return !!token;
  }

  login(credentials: LoginCredentials): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/token/`, credentials)
      .pipe(
        tap(tokens => {
          this.storeTokens(tokens);
          this.isAuthenticatedSubject.next(true);
          // TODO: Fetch user permissions after successful login
          // this.fetchUserPermissions().subscribe();
        }),
        catchError(this.handleError)
      );
  }

  refreshToken(): Observable<TokenResponse> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      this.logout();
      return throwError('No refresh token available');
    }
    return this.http.post<TokenResponse>(`${this.API_URL}/token/refresh/`, { refresh })
      .pipe(
        tap(tokens => this.storeTokens(tokens)),
        catchError(error => {
          this.logout();
          return this.handleError(error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_PERMISSIONS_KEY);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  storeTokens(tokens: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.access);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  storeUserPermissions(permissions: UserPermissions): void {
    localStorage.setItem(this.USER_PERMISSIONS_KEY, JSON.stringify(permissions));
  }

  getUserPermissions(): UserPermissions | null {
    const permissionsString = localStorage.getItem(this.USER_PERMISSIONS_KEY);
    return permissionsString ? JSON.parse(permissionsString) : null;
  }

  hasAccessToProcess(processId: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions?.allowedProcesses.includes(processId) || false;
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    // Add more sophisticated error handling here (e.g., redirect to an error page)
    return throwError(error);
  }

  // TODO: Implement logic to fetch user permissions from the API
  // fetchUserPermissions(): Observable<UserPermissions> {
  //   return this.http.get<UserPermissions>(`${this.API_URL}/api/user/permissions/`)
  //     .pipe(
  //       tap(permissions => this.storeUserPermissions(permissions)),
  //       catchError(this.handleError)
  //     );
  // }
}
