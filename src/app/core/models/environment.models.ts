/**
 * Represents a credential with dynamic values based on its schema
 * Values can be of any type (string, number, boolean) and sensitive fields are masked as '***'
 */
export interface Credential {
  id: number;
  name: string;
  credential_type_name: string;
  credential_type_id: number;
  values: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserEnvironment {
  id: number;
  client: number;
  client_name: string;
  environment: number;
  environment_name: string;
  name: string;
  is_active: boolean;
  credentials: Credential[];
  credentials_count: number;
}

export interface EnvironmentsResponse {
  environments: UserEnvironment[];
  count: number;
  current_environment_ids: number[];
  current_environment_client_id: number | null;
  current_environment_client_name: string | null;
  current_environment_type_id: number | null;
  current_environment_type_name: string | null;
  current_environment_credential_ids: number[];
}

export interface SetCurrentEnvironmentResponse {
  message: string;
  current_environment_ids: number[];
  current_environment_client_id: number | null;
  current_environment_client_name: string | null;
  current_environment_type_id: number | null;
  current_environment_type_name: string | null;
  current_environment_credential_ids: number[];
  environments: Array<{ id: number; name: string }>;
}

/**
 * Represents the current environment information
 */
export interface CurrentEnvironment {
  id: number;
  name: string;
  client_name: string;
  client_id: number;
  environment_name: string;
  environment_id: number;
  is_active: boolean;
}

/**
 * Response from GET /api/v1/user/current-environment/details/
 * Contains current environment information and all configured credentials
 */
export interface EnvironmentDetailsResponse {
  environment: CurrentEnvironment;
  credentials: Credential[];
  credentials_count: number;
}
