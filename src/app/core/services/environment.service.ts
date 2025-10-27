import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentsResponse } from '../models/environment.models';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly API_URL = '/api/v1/user/environments';

  constructor(private http: HttpClient) { }

  getUserEnvironments(): Observable<EnvironmentsResponse> {
    return this.http.get<EnvironmentsResponse>(this.API_URL);
  }
}
