export interface LoginCredentials {
    username: string;
    password: string;
}

export interface TokenResponse {
    access: string;
    refresh: string;
}

export interface RefreshTokenRequest {
    refresh: string;
}

export interface UserPermissions {
    allowedProcesses: string[];  // List of allowed processes
    isAuthenticated: boolean;    // Authentication status
}

export interface ProcessAccess {
    processId: string;          // Process identifier
    canAccess: boolean;         // Whether access is granted
    canExecute: boolean;        // Whether execution is allowed
}
