import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { EnvironmentService } from '../../core/services/environment.service';
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
      </div>
    </div>

    <div class="admin-container">
      <header class="admin-header">
        <h2>Select Environment Type</h2>
        <p>Choose the type of environment to work with. The available connections will be filtered based on your selection.</p>
      </header>

      <main class="content-grid" *ngIf="(environmentGroups$ | async) as groups; else loadingOrPrompt">
        <div *ngIf="groups.length > 0; else noEnvironmentsForClient">
          <div 
            class="content-card" 
            *ngFor="let group of groups" 
            (click)="selectEnvironmentAndNavigate(group.name)"
            [class.selected]="group.name === selectedTypeName">
            <div class="card-icon"><i class="fas fa-layer-group"></i></div>
            <div class="card-content">
              <h2 class="client-name">{{ group.name }}</h2>
              <p class="environment-count">{{ group.count }} connection(s)</p>
            </div>
            <div class="selection-indicator"><i class="fas fa-check-circle"></i></div>
          </div>
        </div>
      </main>
      
      <ng-template #loadingOrPrompt>
        <div *ngIf="selectedClientId; else noClientPrompt">
          <p class="loading-text">Loading environments...</p>
        </div>
      </ng-template>

      <ng-template #noClientPrompt>
        <div class="no-content prompt">
          <i class="fas fa-info-circle"></i>
          <p>No Client Selected</p>
          <span>Please <a routerLink="/clients">select a client</a> first to see its environments.</span>
        </div>
      </ng-template>

      <ng-template #noEnvironmentsForClient>
        <div class="no-content prompt">
          <i class="fas fa-info-circle"></i>
          <p>No Environments Found</p>
          <span>The selected client does not have any environments configured.</span>
        </div>
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
export class EnvironmentsAdminComponent implements OnInit, OnDestroy {
  
  environmentGroups$!: Observable<EnvironmentGroup[]>;
  selectedClientId: number | null = null;
  selectedTypeName: string | null = null;
  private stateSubscription!: Subscription;

  constructor(
    private environmentService: EnvironmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the working state (temporary during navigation)
    this.stateSubscription = this.environmentService.workingState$.subscribe(state => {
      this.selectedClientId = state.clientId;
      this.selectedTypeName = state.typeName;
    });

    // Get environment groups from working state
    this.environmentGroups$ = this.environmentService.workingState$.pipe(
      map(state => {
        if (!state.clientId) {
          return []; // If no client is selected, there are no groups to show
        }

        const filteredEnvs = state.allUserEnvironments.filter(env => env.client === state.clientId);
        const groupCounts = new Map<string, number>();

        filteredEnvs.forEach(env => {
          groupCounts.set(env.environment_name, (groupCounts.get(env.environment_name) || 0) + 1);
        });

        return Array.from(groupCounts, ([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  selectEnvironmentAndNavigate(groupName: string): void {
    // Update the central state with the new type selection
    // and clear the final connection selection.
    this.environmentService.selectEnvironmentType(groupName);
    this.router.navigate(['/connections']);
  }
}
