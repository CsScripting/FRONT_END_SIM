import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnvironmentService } from '../../core/services/environment.service';
import { EnvironmentDetailsResponse, Credential } from '../../core/models/environment.models';

@Component({
  selector: 'app-external-provider',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './external-provider.html',
  styleUrl: './external-provider.scss'
})
export class ExternalProviderComponent implements OnInit {
  
  environmentDetails: EnvironmentDetailsResponse | null = null;
  loading = true;
  error: string | null = null;
  
  constructor(private environmentService: EnvironmentService) {}

  ngOnInit(): void {
    this.loadEnvironmentDetails();
  }

  /**
   * Loads the current environment details from the API
   */
  loadEnvironmentDetails(): void {
    this.loading = true;
    this.error = null;

    this.environmentService.getCurrentEnvironmentDetails().subscribe({
      next: (details) => {
        this.environmentDetails = details;
        this.loading = false;
        console.log('Environment details loaded:', details);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400) {
          this.error = 'NO_ENVIRONMENT_SELECTED';
        } else if (err.status === 404) {
          this.error = 'USER_PROFILE_NOT_FOUND';
        } else {
          this.error = 'GENERIC_ERROR';
        }
        console.error('Error loading environment details:', err);
      }
    });
  }

  /**
   * Returns an array of key-value pairs from credential values for template iteration
   */
  getCredentialFields(credential: Credential): Array<{ key: string; value: any; isSensitive: boolean }> {
    return Object.entries(credential.values).map(([key, value]) => ({
      key,
      value,
      isSensitive: value === '***'
    }));
  }
}
