import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProcessService } from '../../core/services/process.service';
import { EnvironmentService } from '../../core/services/environment.service';
import { Process } from '../../core/models/process.models';

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './process.html',
  styleUrl: './process.scss'
})
export class ProcessComponent implements OnInit {
  processes = signal<Process[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentEnvironmentId = signal<number | null>(null);
  currentEnvironmentName = signal<string>('');

  constructor(
    private processService: ProcessService,
    private environmentService: EnvironmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to persisted state to get current environment
    this.environmentService.persistedState$.subscribe(state => {
      if (state.environmentIds.length > 0) {
        // Use the first environment ID
        this.currentEnvironmentId.set(state.environmentIds[0]);
        
        // Get environment name from allUserEnvironments
        const env = state.allUserEnvironments.find(e => e.id === state.environmentIds[0]);
        this.currentEnvironmentName.set(env?.name || 'Unknown Environment');
        
        // Load processes for this environment
        this.loadProcesses(state.environmentIds[0]);
      } else {
        this.error.set('NO_ENVIRONMENT_SELECTED');
      }
    });
  }

  /**
   * Loads processes for the specified environment
   */
  loadProcesses(environmentId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.processService.getProcessesByEnvironment(environmentId).subscribe({
      next: (processes) => {
        this.processes.set(processes);
        this.loading.set(false);
        console.log('Processes loaded:', processes);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('LOAD_ERROR');
        console.error('Error loading processes:', err);
      }
    });
  }

  /**
   * Navigate to process detail page
   */
  viewProcessDetail(process: Process): void {
    this.router.navigate(['/process', process.id], {
      state: { process: process }
    });
  }
}
