/**
 * Process Model
 * Represents a process/workflow that can be executed for a specific environment
 */
export interface Process {
  id: number;
  name: string;
  credential_type_name: string;
  execution_mode_name: string;
  domain_logic: string;
  default_payload: ProcessDefaultPayload;
  output_schema_example: any;
  output_columns_metadata: OutputColumnMetadata[];
  input_schema_example: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Output column metadata from backend
 */
export interface OutputColumnMetadata {
  field: string;
  label: string;
  type: string;
  sortable: boolean;
  filterable: boolean;
  hidden?: boolean;
  display?: 'count' | 'list' | 'first';
}

/**
 * Default payload structure for a process
 */
export interface ProcessDefaultPayload {
  _internal: {
    client_environment_id: number | null;
  };
  _external_api: ExternalApiConfig;
  _metadata: ProcessMetadata;
}

/**
 * External API configuration
 */
export interface ExternalApiConfig {
  filters: any[];
  paging: {
    pageSize: number;
    pageNumber: number;
  };
  sorts?: any[];
  groups?: any[];
  aggregates?: any[];
}

/**
 * Process metadata with available filters, sorts, etc.
 */
export interface ProcessMetadata {
  available_filters: AvailableFilter[];
  available_sorts: AvailableSort[];
  paging_config: PagingConfig;
}

/**
 * Available filter definition
 */
export interface AvailableFilter {
  path: string;
  label: string;
  type: string;
  filter_type: number;
  required: boolean;
  values_source: ValuesSource;
}

/**
 * Values source for filter dropdown
 */
export interface ValuesSource {
  type: string;
  method: string;
  endpoint: string;
  display_field: string;
  value_field: string;
  payload?: any;
}

/**
 * Available sort option
 */
export interface AvailableSort {
  path: string;
  label: string;
}

/**
 * Paging configuration
 */
export interface PagingConfig {
  max_page_size: number;
  default_page_size: number;
}

/**
 * Filter for process execution
 */
export interface ProcessFilter {
  type: number;
  path: string;
  Value: any; // Note: Capital V as per API specification
}

/**
 * Paging configuration for process execution
 */
export interface ProcessPaging {
  pageSize: number;
  pageNumber: number;
}

/**
 * Payload for executing a process (corrected structure)
 */
export interface ProcessExecutionPayload {
  _internal: {
    client_environment_id: number;
  };
  _external_api: {
    filters: ProcessFilter[];
    paging: ProcessPaging;
  };
}

/**
 * Response from process execution
 */
export interface ProcessExecutionResponse {
  message: string;
  job_id?: number;
  process_name: string;
  environment: string;
  credential_used: string;
  status: string;
  data?: any[];
}

/**
 * Lookup response for filter values
 */
export interface LookupResponse {
  lookup_type: string;
  count: number;
  items: LookupItem[];
}

/**
 * Lookup item (dropdown option)
 */
export interface LookupItem {
  value: any;
  label: string;
  data?: any;
}

