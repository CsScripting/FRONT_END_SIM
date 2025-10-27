import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { AdminSelectionService } from './admin-selection.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { EnvironmentService } from './environment.service';
import { Client } from '../models/client.models';

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
    private adminSelectionService: AdminSelectionService,
    private environmentService: EnvironmentService
  ) {
    const routerEvents$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    );

    const selectedClient$ = toObservable(this.adminSelectionService.selectedClient);
    const selectedEnvironment$ = toObservable(this.adminSelectionService.selectedEnvironment);

    // Get a list of all clients to resolve names from IDs
    const clients$ = this.environmentService.getUserEnvironments().pipe(
      map(response => {
        const clientsMap = new Map<number, string>();
        response.environments.forEach(env => {
          if (!clientsMap.has(env.client)) {
            clientsMap.set(env.client, env.client_name);
          }
        });
        return Array.from(clientsMap, ([id, name]) => ({ id, name }));
      })
    );

    combineLatest([routerEvents$, clients$, selectedClient$, selectedEnvironment$]).pipe(
      map(([_, clients, selectedClientId, selectedEnvGroup]) => {
        const root = this.router.routerState.snapshot.root;
        const baseCrumbs: Breadcrumb[] = [];
        this.addBreadcrumb(root, [], baseCrumbs);

        // If an admin has selected a client, build a contextual breadcrumb
        if (selectedClientId) {
          const client = clients.find(c => c.id === selectedClientId);
          if (client) {
            const contextualCrumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }];
            contextualCrumbs.push({ label: client.name, url: '/clients' });

            if (selectedEnvGroup) {
              contextualCrumbs.push({ label: selectedEnvGroup, url: '/environments-admin' });
            }
            return contextualCrumbs;
          }
        }
        
        // Otherwise, return the default breadcrumb based on the route
        return baseCrumbs;
      })
    ).subscribe(breadcrumbs => {
      this._breadcrumbs$.next(breadcrumbs);
    });
  }

  private isUserOnAdminRoute(route: ActivatedRouteSnapshot): boolean {
    const routeConfigPath = route.firstChild?.routeConfig?.path;
    return routeConfigPath === 'clients' || routeConfigPath === 'environments-admin';
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
