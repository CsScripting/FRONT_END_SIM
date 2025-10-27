import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminSelectionService {
  
  private selectedClientId = signal<number | null>(null);
  private selectedEnvironmentGroup = signal<string | null>(null);
  // Store the IDs of the final UserEnvironment objects (connections)
  private selectedConnectionIds = signal<Set<number>>(new Set());

  public readonly selectedClient = this.selectedClientId.asReadonly();
  public readonly selectedEnvironment = this.selectedEnvironmentGroup.asReadonly();
  public readonly selectedConnections = this.selectedConnectionIds.asReadonly();

  constructor() { }

  selectClient(clientId: number): void {
    this.selectedClientId.update(currentId => {
      const newId = currentId === clientId ? null : clientId;
      
      // When client selection changes, clear subsequent selections
      if (newId !== currentId) {
        this.selectedEnvironmentGroup.set(null);
        this.selectedConnectionIds.set(new Set());
      }
      
      console.log('Selected Client ID:', newId);
      return newId;
    });
  }

  selectEnvironmentGroup(groupName: string | null): void {
    this.selectedEnvironmentGroup.set(groupName);
    // Also clear connections when the group changes
    this.selectedConnectionIds.set(new Set());
    console.log('Selected Environment Group:', groupName);
  }

  toggleConnection(connectionId: number): void {
    this.selectedConnectionIds.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
      }
      console.log('Selected Connection IDs:', newSet);
      return newSet;
    });
  }

  isClientSelected(clientId: number): boolean {
    return this.selectedClientId() === clientId;
  }

  isConnectionSelected(connectionId: number): boolean {
    return this.selectedConnectionIds().has(connectionId);
  }
}
