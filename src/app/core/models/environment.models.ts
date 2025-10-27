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
}
