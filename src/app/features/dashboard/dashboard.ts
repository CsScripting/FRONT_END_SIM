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
    // This component now simply reflects the final selection made elsewhere
    const state$ = this.environmentService.currentSelectionState$;

    this.hasSelection$ = state$.pipe(
      tap(state => console.log('DashboardComponent: Received state for hasSelection$ pipe:', state)),
      map(state => state.environmentIds.length > 0)
    );

    this.selectedConnections$ = state$.pipe(
      tap(state => console.log('DashboardComponent: Received state for selectedConnections$ pipe:', state)),
      map(state => 
        state.allUserEnvironments.filter(env => 
          state.environmentIds.includes(env.id)
        )
      )
    );
  }
}
