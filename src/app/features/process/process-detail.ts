import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { forkJoin } from 'rxjs';

import { ProcessService } from '../../core/services/process.service';
import { EnvironmentService } from '../../core/services/environment.service';
import { 
  Process, 
  AvailableFilter, 
  LookupItem, 
  ProcessFilter,
  OutputColumnMetadata 
} from '../../core/models/process.models';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-process-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './process-detail.html',
  styleUrl: './process-detail.scss'
})
export class ProcessDetailComponent implements OnInit {
  
  // Process data
  process = signal<Process | null>(null);
  currentEnvironmentId = signal<number | null>(null);
  
  // Grid configuration
  rowData = signal<any[]>([]);
  columnDefs = signal<ColDef[]>([]);
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    maxWidth: 500,
  };
  
  // AG Grid theme (v34+ uses Theming API)
  gridTheme = themeQuartz;

  // Filter configuration
  filtersForm!: FormGroup;
  filterOptions = signal<{ [key: string]: LookupItem[] }>({});
  availableFilters = signal<AvailableFilter[]>([]);
  
  // UI State
  loading = signal<boolean>(false);
  loadingFilters = signal<boolean>(false);
  executing = signal<boolean>(false);
  error = signal<string | null>(null);
  hasExecuted = signal<boolean>(false);
  totalRecords = signal<number>(0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processService: ProcessService,
    private environmentService: EnvironmentService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Get process from navigation state or route params
    const navigation = history.state;
    const processId = this.route.snapshot.paramMap.get('id');

    if (navigation && navigation.process) {
      // Process passed via state
      this.process.set(navigation.process);
      this.initializeProcessView();
    } else if (processId) {
      // Need to fetch process by ID
      this.loadProcessById(parseInt(processId));
    } else {
      this.error.set('PROCESS_NOT_FOUND');
    }
  }

  /**
   * Load process by ID if not passed via state
   */
  loadProcessById(processId: number): void {
    this.loading.set(true);
    
    // Get current environment
    this.environmentService.persistedState$.subscribe(state => {
      if (state.environmentIds.length > 0) {
        this.currentEnvironmentId.set(state.environmentIds[0]);
        
        // Fetch all processes and find the one we need
        this.processService.getProcessesByEnvironment(state.environmentIds[0]).subscribe({
          next: (processes) => {
            const foundProcess = processes.find(p => p.id === processId);
            if (foundProcess) {
              this.process.set(foundProcess);
              this.initializeProcessView();
            } else {
              this.error.set('PROCESS_NOT_FOUND');
              this.loading.set(false);
            }
          },
          error: (err) => {
            console.error('Error loading process:', err);
            this.error.set('LOAD_ERROR');
            this.loading.set(false);
          }
        });
      } else {
        this.error.set('NO_ENVIRONMENT_SELECTED');
        this.loading.set(false);
      }
    });
  }

  /**
   * Initialize the process view (columns, filters)
   */
  initializeProcessView(): void {
    const proc = this.process();
    if (!proc) return;

    console.log('🔍 Process loaded:', proc);
    console.log('📊 Output columns metadata:', proc.output_columns_metadata);

    // Get current environment
    this.environmentService.persistedState$.subscribe(state => {
      if (state.environmentIds.length > 0) {
        this.currentEnvironmentId.set(state.environmentIds[0]);
        
        // Generate columns from output columns metadata
        if (proc.output_columns_metadata && proc.output_columns_metadata.length > 0) {
          console.log('✅ Generating columns from metadata...');
          this.generateColumnsFromMetadata(proc.output_columns_metadata);
        } else {
          console.warn('⚠️ No output_columns_metadata found! Using fallback...');
          // Fallback to output_schema_example if metadata not available
          this.generateColumnsFromSchema(proc.output_schema_example);
        }
        
        // Load available filters
        this.loadFilters(proc);
        
        this.loading.set(false);
      } else {
        this.error.set('NO_ENVIRONMENT_SELECTED');
        this.loading.set(false);
      }
    });
  }

  /**
   * Generate AG Grid columns from output columns metadata (provided by backend)
   */
  generateColumnsFromMetadata(columnsMetadata: OutputColumnMetadata[]): void {
    if (!columnsMetadata || columnsMetadata.length === 0) {
      this.columnDefs.set([]);
      return;
    }

    const cols: ColDef[] = [];
    
    // Filter out hidden columns
    const visibleColumns = columnsMetadata.filter(col => !col.hidden);
    
    for (const colMeta of visibleColumns) {
      const colDef: ColDef = {
        field: colMeta.field,
        headerName: colMeta.label,
        sortable: colMeta.sortable,
        filter: colMeta.filterable,
      };

      // Handle nested fields (e.g., "academicYear.name")
      if (colMeta.field.includes('.')) {
        colDef.valueGetter = (params) => {
          return this.getNestedValue(params.data, colMeta.field);
        };
      }

      // Handle array fields
      if (colMeta.type === 'array') {
        colDef.valueGetter = (params) => {
          const arr = params.data?.[colMeta.field];
          if (!Array.isArray(arr) || arr.length === 0) {
            return colMeta.display === 'count' ? '0' : '-';
          }

          switch (colMeta.display) {
            case 'count':
              return arr.length.toString();
            
            case 'list':
              // Show names separated by comma
              return arr.map((item: any) => item.name || item.code || item.id).join(', ');
            
            case 'first':
              // Show only first item
              const first = arr[0];
              return first?.name || first?.code || first?.id || '-';
            
            default:
              return `${arr.length} items`;
          }
        };
      }

      // Handle datetime fields
      if (colMeta.type === 'datetime') {
        colDef.valueFormatter = (params) => {
          if (!params.value) return '';
          try {
            const date = new Date(params.value);
            return date.toLocaleString('pt-PT', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return params.value;
          }
        };
      }

      cols.push(colDef);
    }
    
    console.log('Generated columns from metadata:', cols);
    this.columnDefs.set(cols);
  }

  /**
   * Get nested value from object using dot notation (e.g., "academicYear.name")
   */
  getNestedValue(obj: any, path: string): any {
    if (!obj) return '';
    
    return path.split('.').reduce((prev, curr) => {
      return prev?.[curr];
    }, obj) || '';
  }

  /**
   * Fallback: Generate columns from output schema (if metadata not available)
   */
  generateColumnsFromSchema(schema: any): void {
    if (!schema) {
      this.columnDefs.set([]);
      return;
    }

    const cols: ColDef[] = [];
    
    for (const key in schema) {
      if (schema.hasOwnProperty(key)) {
        const value = schema[key];
        
        // Simple value (string type indicator like "int", "str", etc.)
        if (typeof value === 'string') {
          cols.push({
            field: key,
            headerName: this.formatHeaderName(key),
            sortable: true,
            filter: true,
          });
        }
        // Object value (nested)
        else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          // For nested objects, try to show the name field
          if (value.hasOwnProperty('name')) {
            cols.push({
              field: `${key}.name`,
              headerName: `${this.formatHeaderName(key)}`,
              sortable: true,
              filter: true,
              valueGetter: (params) => {
                const obj = params.data?.[key];
                return obj?.name || '';
              }
            });
          }
        }
        // Array value
        else if (Array.isArray(value)) {
          cols.push({
            field: key,
            headerName: this.formatHeaderName(key),
            sortable: false,
            filter: false,
            valueGetter: (params) => {
              const arr = params.data?.[key];
              return arr ? `${arr.length} items` : '0 items';
            }
          });
        }
      }
    }
    
    console.log('Generated columns from schema (fallback):', cols);
    this.columnDefs.set(cols);
  }

  /**
   * Format header name from camelCase to Title Case
   */
  formatHeaderName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Load available filters and populate dropdowns
   */
  loadFilters(process: Process): void {
    const metadata = process.default_payload?._metadata;
    if (!metadata || !metadata.available_filters || metadata.available_filters.length === 0) {
      // No filters available
      this.availableFilters.set([]);
      this.filtersForm = this.fb.group({});
      return;
    }

    this.availableFilters.set(metadata.available_filters);
    this.loadingFilters.set(true);

    // Create form controls for each filter
    // Note: Replace dots in filter paths with underscores for FormControl names
    const formControls: { [key: string]: any } = {};
    metadata.available_filters.forEach(filter => {
      const controlName = this.getFilterControlName(filter.path);
      // Create control disabled initially while loading
      formControls[controlName] = [{value: null, disabled: true}];
    });
    this.filtersForm = this.fb.group(formControls);

    // Load lookup values for each filter
    const lookupRequests = metadata.available_filters.map(filter => {
      const lookupType = this.extractLookupType(filter.path);
      return this.processService.getFilterValues(
        process.id,
        lookupType,
        this.currentEnvironmentId()!
      );
    });

    forkJoin(lookupRequests).subscribe({
      next: (responses) => {
        const options: { [key: string]: LookupItem[] } = {};
        
        metadata.available_filters.forEach((filter, index) => {
          const controlName = this.getFilterControlName(filter.path);
          options[controlName] = responses[index].items;
          
          // Enable the control after loading options
          this.filtersForm.get(controlName)?.enable();
        });
        
        this.filterOptions.set(options);
        this.loadingFilters.set(false);
      },
      error: (err) => {
        console.error('Error loading filter values:', err);
        
        // Enable controls even if loading failed
        metadata.available_filters.forEach(filter => {
          const controlName = this.getFilterControlName(filter.path);
          this.filtersForm.get(controlName)?.enable();
        });
        
        this.loadingFilters.set(false);
        // Continue without filter values
      }
    });
  }

  /**
   * Get FormControl name from filter path (replace dots with underscores)
   * E.g., "AcademicYear.Id" -> "AcademicYear_Id"
   */
  getFilterControlName(filterPath: string): string {
    return filterPath.replace(/\./g, '_');
  }

  /**
   * Get original filter path from FormControl name
   * E.g., "AcademicYear_Id" -> "AcademicYear.Id"
   */
  getOriginalFilterPath(controlName: string): string {
    return controlName.replace(/_/g, '.');
  }

  /**
   * Extract lookup type from filter path (e.g., "AcademicYear.Id" -> "AcademicYear")
   */
  extractLookupType(path: string): string {
    return path.split('.')[0];
  }

  /**
   * Execute the process with selected filters
   */
  executeProcess(): void {
    const proc = this.process();
    const envId = this.currentEnvironmentId();
    
    if (!proc || !envId) {
      console.error('Process or environment not available');
      return;
    }

    this.executing.set(true);
    this.error.set(null);

    // Build filters array from form values
    const filters: ProcessFilter[] = [];
    const formValues = this.filtersForm.value;
    
    for (const controlName in formValues) {
      if (formValues[controlName] !== null && formValues[controlName] !== undefined && formValues[controlName] !== '') {
        // Convert control name back to original filter path
        const originalPath = this.getOriginalFilterPath(controlName);
        
        filters.push({
          type: 0,
          path: originalPath,
          Value: formValues[controlName]
        });
      }
    }

    console.log('Executing process with filters:', filters);

    this.processService.executeProcess(proc.id, envId, filters).subscribe({
      next: (result) => {
        console.log('✅ Process execution result:', result);
        
        if (result.data && Array.isArray(result.data)) {
          console.log('📊 Data received:', result.data.length, 'records');
          console.log('📋 Current columnDefs:', this.columnDefs());
          console.log('🔍 Sample data:', result.data[0]);
          
          this.rowData.set(result.data);
          this.totalRecords.set(result.data.length);
          this.hasExecuted.set(true);
          this.executing.set(false);
          
          console.log('✅ Grid state updated - hasExecuted:', this.hasExecuted(), 'totalRecords:', this.totalRecords());
          
          // Auto-size columns after data is loaded
          setTimeout(() => {
            this.autoSizeAllColumns();
          }, 100);
        } else {
          console.warn('⚠️ No data returned or data is not an array');
          // No data returned
          this.rowData.set([]);
          this.totalRecords.set(0);
          this.hasExecuted.set(true);
          this.executing.set(false);
        }
      },
      error: (err) => {
        console.error('❌ Error executing process:', err);
        this.error.set('EXECUTION_ERROR');
        this.executing.set(false);
      }
    });
  }

  // Grid API reference
  private gridApi: any;

  /**
   * Called when grid is ready
   */
  onGridReady(params: GridReadyEvent): void {
    console.log('🎯 AG Grid is ready!');
    console.log('   - Row count:', params.api.getDisplayedRowCount());
    console.log('   - Column count:', params.api.getColumns()?.length || 0);
    
    // Store grid API reference
    this.gridApi = params.api;
    
    // Auto-size all columns based on content
    this.autoSizeAllColumns();
  }

  /**
   * Auto-size all columns to fit their header text
   */
  autoSizeAllColumns(): void {
    if (this.gridApi) {
      const columns = this.gridApi.getColumns();
      if (columns) {
        columns.forEach((col: any) => {
          const colDef = col.getColDef();
          const headerName = colDef.headerName || colDef.field || '';
          
          // Calculate approximate width based on header text length
          // Assuming ~8px per character + 40px for padding and icons
          const calculatedWidth = Math.max(
            (headerName.length * 8) + 40,
            80  // minimum width
          );
          
          // Set the column width
          this.gridApi.setColumnWidth(col.getColId(), calculatedWidth);
        });
        console.log('📏 Columns sized to header text');
      }
    }
  }

  /**
   * Clear all grid filters
   */
  clearAllGridFilters(): void {
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      console.log('🧹 All grid filters cleared');
    }
  }

  /**
   * Navigate back to process list
   */
  goBack(): void {
    this.router.navigate(['/process']);
  }

  /**
   * Export data to CSV
   */
  exportToCSV(): void {
    // TODO: Implement using AG Grid API
    console.log('Export to CSV');
  }
}

