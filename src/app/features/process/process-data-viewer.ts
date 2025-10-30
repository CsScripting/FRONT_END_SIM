import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent } from 'ag-grid-community';

@Component({
  selector: 'app-process-data-viewer',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './process-data-viewer.html',
  styleUrl: './process-data-viewer.scss'
})
export class ProcessDataViewerComponent implements OnInit {
  
  rowData = signal<any[]>([]);
  columnDefs = signal<ColDef[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  processName = signal<string>('');
  totalRecords = signal<number>(0);

  // Default column definition
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get data from route state
    const navigation = history.state;
    
    if (navigation && navigation.data && navigation.processName) {
      this.processName.set(navigation.processName);
      this.loadData(navigation.data);
    } else {
      this.error.set('NO_DATA');
      this.loading.set(false);
    }
  }

  /**
   * Loads data into the grid
   */
  loadData(data: any[]): void {
    try {
      if (!data || data.length === 0) {
        this.error.set('EMPTY_RESULT');
        this.loading.set(false);
        return;
      }

      this.rowData.set(data);
      this.totalRecords.set(data.length);
      
      // Generate column definitions dynamically from first row
      this.columnDefs.set(this.generateColumnDefs(data[0]));
      
      this.loading.set(false);
    } catch (err) {
      console.error('Error loading data:', err);
      this.error.set('LOAD_ERROR');
      this.loading.set(false);
    }
  }

  /**
   * Generates column definitions dynamically based on data structure
   */
  generateColumnDefs(firstRow: any): ColDef[] {
    const cols: ColDef[] = [];
    
    for (const key in firstRow) {
      if (firstRow.hasOwnProperty(key)) {
        const value = firstRow[key];
        
        // Simple value (string, number, boolean)
        if (typeof value !== 'object' || value === null) {
          cols.push({
            field: key,
            headerName: this.formatHeaderName(key),
            sortable: true,
            filter: true,
          });
        }
        // Object value (nested)
        else if (!Array.isArray(value)) {
          cols.push({
            field: key,
            headerName: this.formatHeaderName(key),
            sortable: false,
            filter: false,
            valueGetter: (params) => {
              const obj = params.data[key];
              return obj ? (obj.name || obj.id || JSON.stringify(obj)) : '';
            }
          });
        }
        // Array value
        else {
          cols.push({
            field: key,
            headerName: this.formatHeaderName(key),
            sortable: false,
            filter: false,
            valueGetter: (params) => {
              const arr = params.data[key];
              return arr ? `${arr.length} items` : '0 items';
            }
          });
        }
      }
    }
    
    return cols;
  }

  /**
   * Formats column header name
   */
  formatHeaderName(key: string): string {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Called when grid is ready
   */
  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
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
    // TODO: Implement CSV export using AG Grid API
    console.log('Export to CSV');
  }
}

