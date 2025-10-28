import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { EnvironmentService, CurrentSelectionState } from '../../core/services/environment.service';
import { Client } from '../../core/models/client.models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="content-header">
      <div class="header-left-content">
        <h1>Clients</h1>
      </div>
    </div>

    <div class="admin-container">
      <header class="admin-header">
        <h2>Select Active Clients</h2>
        <p>Choose the clients you want to work with. The available environments will be filtered based on your selection.</p>
      </header>

      <main class="content-grid" *ngIf="clients$ | async as clients; else loading">
        <div 
          class="content-card" 
          *ngFor="let client of clients" 
          (click)="selectClientAndNavigate(client.id)"
          [class.selected]="client.id === selectedClientId">
          
          <div class="card-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="card-content">
            <h2 class="client-name">{{ client.name }}</h2>
          </div>
          <div class="selection-indicator">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
        <div *ngIf="clients.length === 0" class="no-content">
            <p>No clients available for your user.</p>
        </div>
      </main>
      
      <ng-template #loading>
        <p class="loading-text">Loading clients...</p>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 1px solid #dee2e6;
      margin-bottom: 20px;
    }

    .content-header h1 {
      font-size: 1.5rem;
      margin: 0;
      font-weight: 400;
      color: #444;
    }

    .header-left-content {
      display: flex;
      align-items: center;
    }

    .breadcrumb {
      display: flex;
      list-style: none;
      padding: 0 0 0 1rem;
      margin: 0 0 0 1rem;
      font-size: 0.9rem;
      background-color: transparent;
      border-left: 1px solid #ced4da;
    }

    .breadcrumb-item + .breadcrumb-item::before {
      content: '>';
      padding: 0 0.5rem;
      color: #6c757d;
    }

    .breadcrumb-item a {
      color: #007bff;
      text-decoration: none;
    }

    .breadcrumb-item.active {
      color: #6c757d;
    }

    .admin-container {
      padding: 10px;
    }

    .admin-header {
      margin-bottom: 20px;
      text-align: left;
    }

    .admin-header h2 {
      font-size: 1.2rem;
      font-weight: 500;
      margin: 0;
    }

    .admin-header p {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .content-card {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e9ecef;
      cursor: pointer;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out;
      display: flex;
      align-items: center;
      gap: 15px;
      position: relative;
      overflow: hidden;
    }

    .content-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .card-icon i {
      font-size: 24px;
      color: #17753f;
    }

    .client-name {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
    }

    .selection-indicator {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 20px;
      color: #28a745;
      opacity: 0;
      transform: scale(0.5);
      transition: opacity 0.2s, transform 0.2s;
    }

    .content-card.selected {
      border-color: #17753f;
      box-shadow: 0 0 0 2px rgba(23, 117, 63, 0.25);
    }

    .content-card.selected .selection-indicator {
      opacity: 1;
      transform: scale(1);
    }

    .loading-text, .no-content {
      color: #6c757d;
      text-align: center;
      padding: 20px;
    }
  `]
})
export class ClientsComponent implements OnInit, OnDestroy {
  clients$!: Observable<Client[]>;
  selectedClientId: number | null = null;
  private stateSubscription!: Subscription;

  constructor(
    private environmentService: EnvironmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the central state to get the currently selected client
    this.stateSubscription = this.environmentService.currentSelectionState$.subscribe(state => {
      this.selectedClientId = state.clientId;
    });

    // Populate the list of clients from the allUserEnvironments in the state
    this.clients$ = this.environmentService.currentSelectionState$.pipe(
      map(state => {
        const clientsMap = new Map<number, string>();
        state.allUserEnvironments.forEach(env => {
          if (!clientsMap.has(env.client)) {
            clientsMap.set(env.client, env.client_name);
          }
        });
        return Array.from(clientsMap, ([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  selectClientAndNavigate(clientId: number): void {
    // Update the central state with the new client selection.
    // This will also clear any downstream selections (type, connections).
    this.environmentService.selectClient(clientId);
    this.router.navigate(['/environments-admin']);
  }
}
