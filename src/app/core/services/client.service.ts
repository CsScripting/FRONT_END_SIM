import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client.models';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly API_URL = '/api/v1/clients/';

  constructor(private http: HttpClient) { }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.API_URL);
  }
}
