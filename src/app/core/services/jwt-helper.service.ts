import { Injectable } from '@angular/core';

export interface JwtPayload {
  user_id: number;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  exp: number;
  iat: number;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class JwtHelperService {

  decodeToken(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }
    const expirationDate = payload.exp * 1000;
    const now = Date.now();
    return expirationDate < now;
  }
}
