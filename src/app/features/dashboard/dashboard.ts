import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { EnvironmentService } from '../../core/services/environment.service';
import { UserEnvironment } from '../../core/models/environment.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  
  selectedConnections$!: Observable<UserEnvironment[]>;
  hasSelection$!: Observable<boolean>;

  constructor(
    private environmentService: EnvironmentService
  ) {}

  ngOnInit(): void {
    // Dashboard shows the PERSISTED state (what is saved in backend)
    const state$ = this.environmentService.persistedState$;

    this.hasSelection$ = state$.pipe(
      tap(state => console.log('DashboardComponent: Received persisted state for hasSelection$:', state)),
      map(state => state.environmentIds.length > 0)
    );

    this.selectedConnections$ = state$.pipe(
      tap(state => console.log('DashboardComponent: Received persisted state for selectedConnections$:', state)),
      map(state => 
        state.allUserEnvironments.filter(env => 
          state.environmentIds.includes(env.id)
        )
      )
    );
  }
}
