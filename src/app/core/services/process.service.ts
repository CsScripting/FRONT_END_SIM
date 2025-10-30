import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Process, 
  ProcessExecutionPayload, 
  ProcessExecutionResponse,
  ProcessFilter,
  LookupResponse
} from '../models/process.models';

@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  private readonly API_URL = '/api/v1/processes';

  constructor(private http: HttpClient) {}

  /**
   * Fetches all processes available for a specific client environment
   * @param clientEnvironmentId - The ID of the client environment
   * @returns Observable of Process array
   */
  getProcessesByEnvironment(clientEnvironmentId: number): Observable<Process[]> {
    return this.http.get<Process[]>(`${this.API_URL}/`, {
      params: { client_environment_id: clientEnvironmentId.toString() }
    });
  }

  /**
   * Gets filter values (lookup) for a specific filter of a process
   * @param processId - The ID of the process
   * @param lookupType - The lookup type (e.g., "AcademicYear")
   * @param clientEnvironmentId - The ID of the client environment
   * @returns Observable of LookupResponse with available values
   */
  getFilterValues(processId: number, lookupType: string, clientEnvironmentId: number): Observable<LookupResponse> {
    return this.http.get<LookupResponse>(
      `${this.API_URL}/${processId}/lookup/${lookupType}/`,
      { params: { client_environment_id: clientEnvironmentId.toString() } }
    );
  }

  /**
   * Executes a specific process with filters and paging
   * @param processId - The ID of the process to execute
   * @param clientEnvironmentId - The ID of the client environment
   * @param filters - Array of filters to apply
   * @returns Observable of the execution result
   */
  executeProcess(
    processId: number, 
    clientEnvironmentId: number, 
    filters: ProcessFilter[] = []
  ): Observable<ProcessExecutionResponse> {
    const payload: ProcessExecutionPayload = {
      _internal: {
        client_environment_id: clientEnvironmentId
      },
      _external_api: {
        filters: filters,
        paging: {
          pageSize: 2000,
          pageNumber: 1
        }
      }
    };
    
    return this.http.post<ProcessExecutionResponse>(
      `${this.API_URL}/${processId}/run/`, 
      payload
    );
  }
}

