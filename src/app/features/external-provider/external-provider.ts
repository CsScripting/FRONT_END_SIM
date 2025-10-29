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

  /**
   * Attempts to find the source endpoint (Extract) from credentials
   * Looks for common URL field names in non-BS_API credentials
   */
  getSourceEndpoint(): string | null {
    if (!this.environmentDetails) return null;

    // Find non-Bullet API credentials (external systems like UXXI, SOPHIA, etc.)
    const sourceCredential = this.environmentDetails.credentials.find(
      cred => !cred.credential_type_name.toUpperCase().includes('BS_API') &&
              !cred.credential_type_name.toUpperCase().includes('BULLET')
    );

    if (!sourceCredential) return null;

    // Look for common URL field names
    const urlFields = ['url', 'endpoint', 'wsdl_url', 'base_url', 'api_url'];
    for (const field of urlFields) {
      if (sourceCredential.values[field] && sourceCredential.values[field] !== '***') {
        return sourceCredential.values[field];
      }
    }

    return null;
  }

  /**
   * Attempts to find the destination endpoint (Load) from credentials
   * Looks for Bullet Solutions API credentials
   */
  getDestinationEndpoint(): string | null {
    if (!this.environmentDetails) return null;

    // Find Bullet API credential
    const destCredential = this.environmentDetails.credentials.find(
      cred => cred.credential_type_name.toUpperCase().includes('BS_API') ||
              cred.credential_type_name.toUpperCase().includes('BULLET')
    );

    if (!destCredential) return null;

    // Look for API base URL
    const urlFields = ['api_base_url', 'base_url', 'url', 'api_url'];
    for (const field of urlFields) {
      if (destCredential.values[field] && destCredential.values[field] !== '***') {
        return destCredential.values[field];
      }
    }

    return null;
  }

  /**
   * Checks if the ETL flow visualization should be shown
   * Requires both source and destination endpoints to be available
   */
  showETLFlow(): boolean {
    return this.getSourceEndpoint() !== null && this.getDestinationEndpoint() !== null;
  }
}
