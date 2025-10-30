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
  templateUrl: './environments-admin.html',
  styleUrl: './environments-admin.scss'
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
