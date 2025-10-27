import { Component, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';

import { EnvironmentService } from '../../core/services/environment.service';
import { AdminSelectionService } from '../../core/services/admin-selection.service';
import { UserEnvironment } from '../../core/models/environment.models';

interface EnvironmentGroup {
  name: string;
  count: number;
}

@Component({
  selector: 'app-environments-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="content-header">
      <div class="header-left-content">
        <h1>Environments</h1>
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/clients">Administration</a></li>
          <li class="breadcrumb-item active">Environments</li>
        </ol>
      </div>
    </div>

    <div class="admin-container">
      <header class="admin-header">
        <button *ngIf="selectedGroup()" (click)="goBack()" class="back-button">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h2>{{ selectedGroup() ? 'Select Connections for ' + selectedGroup() : 'Select Environment Type' }}</h2>
        <p>{{ selectedGroup() ? 'Activate the specific connections to display on the dashboard.' : 'Choose the type of environment to work with.' }}</p>
      </header>

      <main class="content-grid" *ngIf="allEnvironments$ | async as allEnvs; else loading">
        
        <!-- View 1: Show Environment Groups -->
        <ng-container *ngIf="!selectedGroup()">
            <div *ngIf="(environmentGroups$ | async) as groups; else noClientsSelected">
                <div *ngIf="groups.length > 0; else noClientsSelected">
                    <div 
                        class="content-card" 
                        *ngFor="let group of groups" 
                        (click)="onSelectGroup(group.name, allEnvs)">
                        <div class="card-icon"><i class="fas fa-layer-group"></i></div>
                        <div class="card-content">
                            <h2 class="client-name">{{ group.name }}</h2>
                            <p class="environment-count">{{ group.count }} connection(s)</p>
                        </div>
                    </div>
                </div>
            </div>
        </ng-container>

        <!-- View 2: Show Connections within a Group -->
        <ng-container *ngIf="selectedGroup()">
            <div 
                class="content-card" 
                *ngFor="let conn of groupConnections()" 
                (click)="toggleConnectionSelection(conn.id)"
                [class.selected]="isConnectionSelected(conn.id)">
                <div class="card-icon"><i class="fas fa-server"></i></div>
                <div class="card-content">
                    <h2 class="client-name">{{ conn.name }}</h2>
                    <p class="environment-count">{{ conn.client_name }}</p>
                </div>
                <div class="selection-indicator"><i class="fas fa-check-circle"></i></div>
            </div>
        </ng-container>

        <ng-template #noClientsSelected>
            <div class="no-content prompt">
                <i class="fas fa-info-circle"></i>
                <p>No Clients Selected</p>
                <span>Please <a routerLink="/clients">select one or more clients</a> to see available environments.</span>
            </div>
        </ng-template>

      </main>
      
      <ng-template #loading>
        <p class="loading-text">Loading environments...</p>
      </ng-template>
    </div>
  `,
  styles: [`
    /* Using a direct copy of client styles for consistency */
    :host { display: block; }
    .content-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; border-bottom: 1px solid #dee2e6; margin-bottom: 20px; }
    .content-header h1 { font-size: 1.5rem; margin: 0; font-weight: 400; color: #444; }
    .header-left-content { display: flex; align-items: center; }
    .breadcrumb { display: flex; list-style: none; padding: 0 0 0 1rem; margin: 0 0 0 1rem; font-size: 0.9rem; background-color: transparent; border-left: 1px solid #ced4da; }
    .breadcrumb-item + .breadcrumb-item::before { content: '>'; padding: 0 0.5rem; color: #6c757d; }
    .breadcrumb-item a { color: #007bff; text-decoration: none; }
    .breadcrumb-item.active { color: #6c757d; }
    .admin-container { padding: 10px; }
    .admin-header { margin-bottom: 20px; text-align: left; display: flex; align-items: center; gap: 1rem; }
    .admin-header h2 { font-size: 1.2rem; font-weight: 500; margin: 0; }
    .admin-header p { color: #6c757d; font-size: 0.9rem; margin: 0; border-left: 1px solid #ced4da; padding-left: 1rem; flex-grow: 1; }
    .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .content-card { background-color: #fff; border-radius: 8px; padding: 20px; border: 1px solid #e9ecef; cursor: pointer; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 15px; position: relative; overflow: hidden; }
    .content-card:hover { transform: translateY(-5px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); }
    .card-icon i { font-size: 24px; color: #17753f; }
    .client-name { font-size: 1.1rem; font-weight: 500; margin: 0; }
    .environment-count { font-size: 0.9rem; color: #6c757d; margin: 0; }
    .selection-indicator { position: absolute; top: 10px; right: 10px; font-size: 20px; color: #28a745; opacity: 0; transform: scale(0.5); transition: opacity 0.2s, transform 0.2s; }
    .content-card.selected { border-color: #17753f; box-shadow: 0 0 0 2px rgba(23, 117, 63, 0.25); }
    .content-card.selected .selection-indicator { opacity: 1; transform: scale(1); }
    .loading-text, .no-content { color: #6c757d; text-align: center; padding: 20px; }
    .prompt { border: 1px dashed #ced4da; border-radius: 8px; background-color: #f8f9fa; grid-column: 1 / -1; }
    .prompt i { font-size: 1.5rem; color: #007bff; margin-bottom: 0.5rem; }
    .prompt p { font-weight: 500; margin-bottom: 0.25rem; }
    .prompt span { font-size: 0.9rem; }
    .back-button { background: #f0f0f0; border: 1px solid #ddd; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background-color 0.2s; }
    .back-button:hover { background-color: #e0e0e0; }
    .back-button i { color: #333; }
  `]
})
export class EnvironmentsAdminComponent implements OnInit {
  
  allEnvironments$!: Observable<UserEnvironment[]>;
  environmentGroups$!: Observable<EnvironmentGroup[]>;
  selectedClientIds$!: Observable<Set<number>>;
  
  selectedGroup = signal<string | null>(null);
  groupConnections = signal<UserEnvironment[]>([]);

  constructor(
    private environmentService: EnvironmentService,
    private adminSelectionService: AdminSelectionService
  ) {
    this.selectedClientIds$ = toObservable(this.adminSelectionService.selectedClients);
  }

  ngOnInit(): void {
    this.allEnvironments$ = this.environmentService.getUserEnvironments().pipe(
      map(response => response.environments)
    );

    this.environmentGroups$ = combineLatest([this.allEnvironments$, this.selectedClientIds$]).pipe(
      map(([allEnvs, selectedClientIds]) => {
        if (selectedClientIds.size === 0) {
          return [];
        }

        const filteredEnvs = allEnvs.filter(env => selectedClientIds.has(env.client));
        const groupCounts = new Map<string, number>();

        filteredEnvs.forEach(env => {
          groupCounts.set(env.environment_name, (groupCounts.get(env.environment_name) || 0) + 1);
        });

        return Array.from(groupCounts, ([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  onSelectGroup(groupName: string, allEnvs: UserEnvironment[]): void {
    const selectedClientIds = this.adminSelectionService.selectedClients();
    const connections = allEnvs.filter(env => 
      env.environment_name === groupName && selectedClientIds.has(env.client)
    );
    this.groupConnections.set(connections);
    this.selectedGroup.set(groupName);
  }

  goBack(): void {
    this.selectedGroup.set(null);
    this.groupConnections.set([]);
  }

  toggleConnectionSelection(connectionId: number): void {
    this.adminSelectionService.toggleConnection(connectionId);
  }

  isConnectionSelected(connectionId: number): boolean {
    return this.adminSelectionService.isConnectionSelected(connectionId);
  }
}
