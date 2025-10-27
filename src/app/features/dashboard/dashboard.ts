import { Component, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnvironmentService } from '../../core/services/environment.service';
import { UserEnvironment } from '../../core/models/environment.models';
import { AuthService } from '../../core/services/auth.service';
import { JwtPayload } from '../../core/services/jwt-helper.service';
import { AdminSelectionService } from '../../core/services/admin-selection.service';

type EnvironmentGroup = { [key: string]: UserEnvironment[] };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  environmentGroups$!: Observable<EnvironmentGroup>;
  selectedGroup = signal<string | null>(null);
  groupEnvironments = signal<UserEnvironment[]>([]);
  
  currentUser$: Observable<JwtPayload | null>;
  hasActiveFilters = signal(false);

  constructor(
    private environmentService: EnvironmentService,
    private authService: AuthService,
    private adminSelectionService: AdminSelectionService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    const allEnvironments$ = this.environmentService.getUserEnvironments().pipe(
      map(response => response.environments)
    );
    const selectedConnectionIds$ = toObservable(this.adminSelectionService.selectedConnections);

    this.environmentGroups$ = combineLatest([
      allEnvironments$,
      this.currentUser$,
      selectedConnectionIds$
    ]).pipe(
      map(([allEnvs, user, selectedConnectionIds]) => {
        if (!user) {
          return {}; // Should not happen due to guard, but safe check
        }

        let filteredEnvs = allEnvs;

        // For staff, the dashboard is now driven by the final connection selection
        if (user.is_staff) {
          this.hasActiveFilters.set(selectedConnectionIds.size > 0);
          
          if (!this.hasActiveFilters()) {
            return {}; // Show prompt if no connections are selected
          }
          // Filter environments to only include those selected in the admin screen
          filteredEnvs = filteredEnvs.filter(env => selectedConnectionIds.has(env.id));
        }

        return this.groupEnvironmentsByName(filteredEnvs);
      })
    );
  }

  private groupEnvironmentsByName(environments: UserEnvironment[]): EnvironmentGroup {
    return environments.reduce((acc, environment) => {
      const key = environment.environment_name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(environment);
      return acc;
    }, {} as EnvironmentGroup);
  }

  onSelectGroup(groupKey: string, groups: EnvironmentGroup): void {
    this.selectedGroup.set(groupKey);
    this.groupEnvironments.set(groups[groupKey]);
  }

  onSelectEnvironment(env: UserEnvironment): void {
    // NOTE: Logic to handle environment selection will be added later
    console.log('Selected environment:', env);
  }

  goBack(): void {
    this.selectedGroup.set(null);
    this.groupEnvironments.set([]);
  }
}
