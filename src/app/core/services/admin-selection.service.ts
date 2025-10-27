import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminSelectionService {
  
  private selectedClientIds = signal<Set<number>>(new Set());
  // Store the IDs of the final UserEnvironment objects (connections)
  private selectedConnectionIds = signal<Set<number>>(new Set());

  public readonly selectedClients = this.selectedClientIds.asReadonly();
  public readonly selectedConnections = this.selectedConnectionIds.asReadonly();

  constructor() { }

  toggleClient(clientId: number): void {
    this.selectedClientIds.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      // When client selection changes, clear the connection selection as it might become invalid
      this.selectedConnectionIds.set(new Set());
      console.log('Selected Client IDs:', newSet);
      return newSet;
    });
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
    return this.selectedClientIds().has(clientId);
  }

  isConnectionSelected(connectionId: number): boolean {
    return this.selectedConnectionIds().has(connectionId);
  }
}
