import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { loadManifest } from '@angular-architects/module-federation';
import { buildRoutes } from './routes';
import { Store } from '@ngrx/store';
import { environment } from 'projects/shell/src/environments/environment';
@Injectable({ providedIn: 'root' })
export class ManifestResolver {
    constructor(private router: Router, private store: Store) {}
    async resolve() {
        await loadManifest(environment.manifestPath || '/assets/mf.manifest.json', true);
        // const manifest: any = await loadManifest(manifestUrl);
        const routes = buildRoutes();
        this.router.resetConfig(routes);
        return true;
    }
}
