import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginCredentials, TokenResponse } from '../models/auth.models';
import { Router } from '@angular/router';
import { JwtHelperService, JwtPayload } from './jwt-helper.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly API_URL = '/api';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<JwtPayload | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    this.loadUserFromToken();
  }

  private loadUserFromToken(): void {
    const token = this.getAccessToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      this.currentUserSubject.next(decodedToken);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  private hasValidAccessToken(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  login(credentials: LoginCredentials): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API_URL}/token/`, credentials)
      .pipe(
        tap(tokens => {
          this.storeTokens(tokens);
          const decodedToken = this.jwtHelper.decodeToken(tokens.access);
          this.currentUserSubject.next(decodedToken);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError(this.handleError)
      );
  }

  refreshToken(): Observable<TokenResponse> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<TokenResponse>(`${this.API_URL}/token/refresh/`, { refresh })
      .pipe(
        tap(tokens => {
          localStorage.setItem(this.TOKEN_KEY, tokens.access);
          const decodedToken = this.jwtHelper.decodeToken(tokens.access);
          this.currentUserSubject.next(decodedToken);
          console.log('Access token refreshed successfully.');
        }),
        catchError(error => {
          this.logout();
          return this.handleError(error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
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

  isStaff(): boolean {
    return this.currentUserSubject.value?.is_staff ?? false;
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}
