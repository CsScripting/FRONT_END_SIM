import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';

import { EnvironmentService } from '../../core/services/environment.service';
import { UserEnvironment } from '../../core/models/environment.models';

@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './connections.html',
  styleUrls: ['./connections.scss']
})
export class ConnectionsComponent implements OnInit, OnDestroy {

  connections = signal<UserEnvironment[]>([]);
  selectionForm!: FormGroup;
  
  selectedClientName: string | null = null;
  selectedTypeName: string | null = null;
  
  private stateSubscription!: Subscription;

  constructor(
    private environmentService: EnvironmentService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.selectionForm = this.fb.group({
      selectedConnections: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Subscribe to working state (temporary during navigation)
    this.stateSubscription = this.environmentService.workingState$.subscribe(state => {
      this.selectedClientName = state.clientName;
      this.selectedTypeName = state.typeName;

      const filteredConnections = state.allUserEnvironments.filter(env => 
        env.client === state.clientId && env.environment_name === state.typeName
      );
      this.connections.set(filteredConnections);
      
      this.updateFormControls(filteredConnections, state.environmentIds);
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  get connectionsFormArray(): FormArray {
    return this.selectionForm.get('selectedConnections') as FormArray;
  }

  private updateFormControls(connections: UserEnvironment[], selectedIds: number[]): void {
    this.connectionsFormArray.clear();
    connections.forEach(conn => {
      const isSelected = selectedIds.includes(conn.id);
      this.connectionsFormArray.push(new FormControl(isSelected));
    });
  }

  onSubmit(): void {
    const selectedIds = this.selectionForm.value.selectedConnections
      .map((checked: boolean, i: number) => checked ? this.connections()[i].id : null)
      .filter((id: number | null) => id !== null);

    // Save selection to backend - only here the state is persisted
    this.environmentService.setCurrentEnvironments(selectedIds).subscribe({
      next: () => {
        console.log('Selection saved successfully to backend');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Failed to save selection', err);
        // TODO: Add user-facing error handling here (e.g., a toast message)
      }
    });
  }

  onCancel(): void {
    // Reset working state to persisted state (discard changes)
    this.environmentService.resetWorkingState();
    console.log('Selection cancelled - working state reset to persisted state');
    this.router.navigate(['/dashboard']);
  }
}
