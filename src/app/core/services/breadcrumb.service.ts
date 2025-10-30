import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter, combineLatest, map } from 'rxjs';
import { EnvironmentService } from './environment.service';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly _breadcrumbs$ = new BehaviorSubject<Breadcrumb[]>([]);
  readonly breadcrumbs$ = this._breadcrumbs$.asObservable();

  constructor(
    private router: Router,
    private environmentService: EnvironmentService
  ) {
    const routerEvents$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    );

    // Use persisted state for breadcrumb (shows what is saved in backend)
    const selectionState$ = this.environmentService.persistedState$;

    combineLatest([routerEvents$, selectionState$]).pipe(
      map(([_, selectionState]) => {
        const root = this.router.routerState.snapshot.root;
        const baseCrumbs: Breadcrumb[] = [];
        this.addBreadcrumb(root, [], baseCrumbs);

        // If a client is selected, build the contextual breadcrumb
        if (selectionState?.clientId && selectionState?.clientName) {
          const contextualCrumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }];

          contextualCrumbs.push({ label: selectionState.clientName, url: '/clients' });

          if (selectionState.typeName) {
            contextualCrumbs.push({ label: selectionState.typeName, url: '/environments-admin' });
          }
          
          // Add connections if they are selected and we are on a relevant page
          if (selectionState.environmentIds.length > 0 && this.isRelevantPage(root)) {
             const connectionLabel = `${selectionState.environmentIds.length} Connection(s)`;
             contextualCrumbs.push({ label: connectionLabel, url: '/connections' });
          }

          return contextualCrumbs;
        }
        
        // Otherwise, return the default breadcrumb based on the route
        return baseCrumbs;
      })
    ).subscribe(breadcrumbs => {
      this._breadcrumbs$.next(breadcrumbs);
    });
  }

  // Helper to determine if we should show the full breadcrumb
  private isRelevantPage(route: ActivatedRouteSnapshot): boolean {
    const path = route.firstChild?.routeConfig?.path;
    return ['dashboard', 'tasks', 'process'].includes(path ?? '');
  }

  /**
   * Set custom breadcrumbs (useful for dynamic pages like process detail)
   */
  setCustomBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this._breadcrumbs$.next(breadcrumbs);
  }

  private addBreadcrumb(route: ActivatedRouteSnapshot | null, parentUrl: string[], breadcrumbs: Breadcrumb[]) {
    if (route) {
      const routeUrl = parentUrl.concat(route.url.map(url => url.path));
      if (route.data['breadcrumb']) {
        const breadcrumb = {
          label: this.getLabel(route.data),
          url: '/' + routeUrl.join('/')
        };
        breadcrumbs.push(breadcrumb);
      }
      this.addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
    }
  }

  private getLabel(data: Data) {
    return typeof data['breadcrumb'] === 'function' ? data['breadcrumb'](data) : data['breadcrumb'];
  }
}
