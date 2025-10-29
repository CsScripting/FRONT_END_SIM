import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  EnvironmentsResponse, 
  SetCurrentEnvironmentResponse, 
  UserEnvironment,
  EnvironmentDetailsResponse 
} from '../models/environment.models';

export interface CurrentSelectionState {
  environmentIds: number[];
  credentialIds: number[];
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
    credentialIds: [],
    clientId: null,
    clientName: null,
    typeId: null,
    typeName: null,
    allUserEnvironments: []
  };

  /**
   * Persisted state - reflects what is saved in the database
   * Only changes after successful PATCH to backend
   */
  private persistedState = new BehaviorSubject<CurrentSelectionState>(this.initialState);
  public persistedState$ = this.persistedState.asObservable();

  /**
   * Working state - temporary state during navigation (Clients -> Environments -> Connections)
   * Can be discarded if user cancels or exits without saving
   */
  private workingState = new BehaviorSubject<CurrentSelectionState>(this.initialState);
  public workingState$ = this.workingState.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Fetches all user environments and their current selection state from the API.
   * Updates both persisted and working states with data from backend.
   */
  loadInitialState(): Observable<EnvironmentsResponse> {
    return this.http.get<EnvironmentsResponse>(`${this.API_URL}/environments/`).pipe(
      tap(response => {
        const state: CurrentSelectionState = {
          environmentIds: response.current_environment_ids,
          credentialIds: response.current_environment_credential_ids || [],
          clientId: response.current_environment_client_id,
          clientName: response.current_environment_client_name,
          typeId: response.current_environment_type_id,
          typeName: response.current_environment_type_name,
          allUserEnvironments: response.environments
        };
        
        // Update both states when loading from database
        this.persistedState.next(state);
        this.workingState.next(state);
        
        console.log('EnvironmentService: Loaded initial state from backend:', state);
      })
    );
  }

  /**
   * Sets the current selected environments by sending a list of IDs to the backend.
   * Only called from Connections component when user clicks "Save Selection".
   * Updates both persisted and working states after successful save.
   */
  setCurrentEnvironments(environmentIds: number[]): Observable<SetCurrentEnvironmentResponse> {
    return this.http.patch<SetCurrentEnvironmentResponse>(
      `${this.API_URL}/current-environment/`,
      { client_environment_ids: environmentIds }
    ).pipe(
      tap(response => {
        const state: Partial<CurrentSelectionState> = {
          environmentIds: response.current_environment_ids,
          credentialIds: response.current_environment_credential_ids || [],
          clientId: response.current_environment_client_id,
          clientName: response.current_environment_client_name,
          typeId: response.current_environment_type_id,
          typeName: response.current_environment_type_name
        };
        
        // Update both states after successful save
        this.updatePersistedState(state);
        this.updateWorkingState(state);
        
        console.log('EnvironmentService: Saved selection to backend:', state);
      })
    );
  }

  /**
   * Fetches detailed information about the current environment including all credentials.
   * Sensitive fields in credentials will be masked as '***'.
   */
  getCurrentEnvironmentDetails(): Observable<EnvironmentDetailsResponse> {
    return this.http.get<EnvironmentDetailsResponse>(`${this.API_URL}/current-environment/details/`);
  }

  /**
   * Updates the selected client in working state (temporary, not saved to backend).
   * Resets subsequent selections (type and connections).
   */
  selectClient(clientId: number): void {
    const currentState = this.getWorkingState();
    const client = currentState.allUserEnvironments.find(env => env.client === clientId);
    if (client) {
      this.updateWorkingState({
        clientId: client.client,
        clientName: client.client_name,
        // Reset subsequent selections
        typeId: null,
        typeName: null,
        environmentIds: []
      });
      
      console.log('EnvironmentService: Client selected (working state only):', client.client_name);
    }
  }

  /**
   * Updates the selected environment type in working state (temporary, not saved to backend).
   * Resets the final connection selection.
   */
  selectEnvironmentType(typeName: string): void {
    const currentState = this.getWorkingState();
    const envType = currentState.allUserEnvironments.find(
      env => env.client === currentState.clientId && env.environment_name === typeName
    );

    if (envType) {
      this.updateWorkingState({
        typeId: envType.environment,
        typeName: envType.environment_name,
        // Reset the final selection
        environmentIds: []
      });
      
      console.log('EnvironmentService: Environment type selected (working state only):', typeName);
    }
  }

  /**
   * Resets the working state to match the persisted state.
   * Called when user cancels selection or navigates away without saving.
   */
  resetWorkingState(): void {
    const persisted = this.persistedState.value;
    this.workingState.next({ ...persisted });
    console.log('EnvironmentService: Working state reset to persisted state');
  }

  /**
   * Clears both persisted and working states.
   * Called on logout to reset the entire environment state.
   */
  clearSelectionState(): void {
    this.persistedState.next(this.initialState);
    this.workingState.next(this.initialState);
    console.log('EnvironmentService: Both states cleared (logout)');
  }

  /**
   * Returns a snapshot of the persisted state (what is saved in backend).
   */
  getPersistedState(): CurrentSelectionState {
    return this.persistedState.value;
  }

  /**
   * Returns a snapshot of the working state (temporary during navigation).
   */
  getWorkingState(): CurrentSelectionState {
    return this.workingState.value;
  }

  /**
   * Updates the persisted state (called after successful backend save).
   */
  private updatePersistedState(newState: Partial<CurrentSelectionState>): void {
    const nextState = {
      ...this.persistedState.value,
      ...newState
    };
    this.persistedState.next(nextState);
  }

  /**
   * Updates the working state (called during navigation, before saving).
   */
  private updateWorkingState(newState: Partial<CurrentSelectionState>): void {
    const nextState = {
      ...this.workingState.value,
      ...newState
    };
    this.workingState.next(nextState);
  }
}
