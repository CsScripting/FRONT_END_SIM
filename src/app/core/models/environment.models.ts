export interface UserEnvironment {
  id: number;
  client: number;
  client_name: string;
  environment: number;
  environment_name: string;
  name: string;
  is_active: boolean;
}

export interface EnvironmentsResponse {
  environments: UserEnvironment[];
  count: number;
  current_environment_ids: number[];
  current_environment_client_id: number | null;
  current_environment_client_name: string | null;
  current_environment_type_id: number | null;
  current_environment_type_name: string | null;
}

export interface SetCurrentEnvironmentResponse {
  message: string;
  current_environment_ids: number[];
  current_environment_client_id: number | null;
  current_environment_client_name: string | null;
  current_environment_type_id: number | null;
  current_environment_type_name: string | null;
  environments: Array<{ id: number; name: string }>;
}
