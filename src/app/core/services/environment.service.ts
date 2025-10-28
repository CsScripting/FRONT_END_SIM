import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EnvironmentsResponse, SetCurrentEnvironmentResponse, UserEnvironment } from '../models/environment.models';

export interface CurrentSelectionState {
  environmentIds: number[];
  clientId: number | null;
  clientName: string | null;
  typeId: number | null;
  typeName: string | null;
  allUserEnvironments: UserEnvironment[];
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly API_URL = '/api/v1/user';

  private readonly initialState: CurrentSelectionState = {
    environmentIds: [],
    clientId: null,
    clientName: null,
    typeId: null,
    typeName: null,
    allUserEnvironments: []
  };

  private currentSelectionState = new BehaviorSubject<CurrentSelectionState>(this.initialState);
  public currentSelectionState$ = this.currentSelectionState.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Fetches all user environments and their current selection state from the API.
   */
  loadInitialState(): Observable<EnvironmentsResponse> {
    return this.http.get<EnvironmentsResponse>(`${this.API_URL}/environments/`).pipe(
      tap(response => {
        this.updateState({
          environmentIds: response.current_environment_ids,
          clientId: response.current_environment_client_id,
          clientName: response.current_environment_client_name,
          typeId: response.current_environment_type_id,
          typeName: response.current_environment_type_name,
          allUserEnvironments: response.environments
        });
      })
    );
  }

  /**
   * Sets the current selected environments by sending a list of IDs to the backend.
   */
  setCurrentEnvironments(environmentIds: number[]): Observable<SetCurrentEnvironmentResponse> {
    return this.http.patch<SetCurrentEnvironmentResponse>(
      `${this.API_URL}/current-environment/`,
      { client_environment_ids: environmentIds }
    ).pipe(
      tap(response => {
        this.updateState({
          environmentIds: response.current_environment_ids,
          clientId: response.current_environment_client_id,
          clientName: response.current_environment_client_name,
          typeId: response.current_environment_type_id,
          typeName: response.current_environment_type_name
        });
      })
    );
  }

  /**
   * Updates the selected client and resets the subsequent selections (type and connections).
   */
  selectClient(clientId: number): void {
    const currentState = this.getCurrentState();
    const client = currentState.allUserEnvironments.find(env => env.client === clientId);
    if (client) {
      this.updateState({
        clientId: client.client,
        clientName: client.client_name,
        // Reset subsequent selections
        typeId: null,
        typeName: null,
        environmentIds: []
      });
    }
  }

  /**
   * Updates the selected environment type and resets the final connection selection.
   */
  selectEnvironmentType(typeName: string): void {
    const currentState = this.getCurrentState();
    const envType = currentState.allUserEnvironments.find(
      env => env.client === currentState.clientId && env.environment_name === typeName
    );

    if (envType) {
      this.updateState({
        typeId: envType.environment,
        typeName: envType.environment_name,
        // Reset the final selection
        environmentIds: []
      });
    }
  }

  /**
   * Resets the selection state to its initial empty value.
   */
  clearSelectionState(): void {
    this.currentSelectionState.next(this.initialState);
  }

  /**
   * Returns a snapshot of the current selection state.
   */
  getCurrentState(): CurrentSelectionState {
    return this.currentSelectionState.value;
  }

  private updateState(newState: Partial<CurrentSelectionState>): void {
    const nextState = {
      ...this.getCurrentState(),
      ...newState
    };
    console.log('EnvironmentService: Updating state to:', nextState);
    this.currentSelectionState.next(nextState);
  }
}
