import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';

import { EnvironmentService } from '../../core/services/environment.service';
import { UserEnvironment, Credential } from '../../core/models/environment.models';

@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './connections.html',
  styleUrls: ['./connections.scss']
})
export class ConnectionsComponent implements OnInit, OnDestroy {

  credentials = signal<Credential[]>([]);
  selectedEnvironment: UserEnvironment | null = null;
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

      // Get environments filtered by client and type
      const filteredEnvironments = state.allUserEnvironments.filter(env => 
        env.client === state.clientId && env.environment_name === state.typeName
      );

      // For now, we show credentials from the FIRST environment that has credentials
      // Or the first environment with selected ID
      let targetEnvironment: UserEnvironment | null = null;

      if (state.environmentIds.length > 0) {
        // If there's a selected environment, use it
        targetEnvironment = filteredEnvironments.find(env => state.environmentIds.includes(env.id)) || null;
      } else {
        // Otherwise, use the first environment with credentials
        targetEnvironment = filteredEnvironments.find(env => env.credentials_count > 0) || filteredEnvironments[0] || null;
      }

      this.selectedEnvironment = targetEnvironment;
      
      if (targetEnvironment) {
        this.credentials.set(targetEnvironment.credentials);
        // All credentials are pre-selected (disabled checkboxes)
        this.updateFormControls(targetEnvironment.credentials);
      } else {
        this.credentials.set([]);
      }
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

  private updateFormControls(credentials: Credential[]): void {
    this.connectionsFormArray.clear();
    // All credentials are pre-selected (checkbox disabled)
    credentials.forEach(() => {
      this.connectionsFormArray.push(new FormControl({ value: true, disabled: true }));
    });
  }

  onSubmit(): void {
    if (!this.selectedEnvironment) {
      console.error('No environment selected');
      return;
    }

    // Send the environment ID (which activates ALL its credentials)
    const environmentId = this.selectedEnvironment.id;

    // Save selection to backend - only here the state is persisted
    this.environmentService.setCurrentEnvironments([environmentId]).subscribe({
      next: () => {
        console.log('Selection saved successfully to backend - Environment ID:', environmentId);
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
