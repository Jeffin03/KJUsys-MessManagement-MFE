import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { buildRoutes } from './routes';
import { ToastrService } from 'ngx-toastr';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { SpinnerStateService } from '@libs/shared-auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MfeCommonService {
  private manifest: any;
  private loadedModules: Set<string> = new Set();

  constructor(
    public router: Router,
    public toastr: ToastrService,
    private spinnerStateService: SpinnerStateService
  ) {}

  async getManifest(): Promise<any> {
    if (!this.manifest) {
      const manifestUrl = environment.manifestPath || '/assets/mf.manifest.json';

      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) throw new Error(`Failed to load manifest: ${manifestUrl}`);
        this.manifest = await response.json();
      } catch (error) {
        console.error(`❌ Error loading manifest file: ${manifestUrl}`, error);
        this.manifest = {}; // Ensure we return an empty object instead of null
      }
    }
    return this.manifest;
  }

  async init() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.spinnerStateService.show();
        
        // Load critical modules first
        // await this.loadCriticalModules();
        
        // Configure router
        const routes = buildRoutes();
        this.router.resetConfig(routes);
        
        // Begin preloading non-critical modules in the background
        setTimeout(() => this.preloadNonCriticalModules(), 1000);
        
        resolve();
      } catch (error) {
        console.error(`❌ Error during initialization:`, error);
        this.toastr.error('Application initialization failed. Please try refreshing the page.');
        reject(error);
      } finally {
        this.spinnerStateService.hide();
      }
    });
  }

  async loadCriticalModules(): Promise<void> {
    // console.time('Critical Modules Load Time');
    const manifest = await this.getManifest();
    const criticalModulePromises = [];
    
    for (const key in manifest) {
      const remoteConfig = manifest[key];
      if (remoteConfig.subModule && Array.isArray(remoteConfig.subModule)) {
        for (const subModule of remoteConfig.subModule) {
          if (subModule.critical) {
            const moduleId = `${remoteConfig.remoteEntry}:${subModule.exposedModule}`;
            
            // Skip if already loaded
            if (this.loadedModules.has(moduleId)) {
              continue;
            }
            
            criticalModulePromises.push(
              loadRemoteModule({
                type: 'module',
                remoteEntry: remoteConfig.remoteEntry,
                exposedModule: subModule.exposedModule,
              })
              .then(() => {
                this.loadedModules.add(moduleId);
                // console.log(`✅ Loaded critical module: ${subModule.exposedModule}`);
              })
              .catch((err) => {
                console.error(`❌ Error loading critical module ${subModule.exposedModule}:`, err);
              })
            );
          }
        }
      }
    }
    
    // Wait for all critical modules to load in parallel
    if (criticalModulePromises.length > 0) {
      await Promise.all(criticalModulePromises);
    }
    // console.timeEnd('Critical Modules Load Time');
  }

  async preloadNonCriticalModules(): Promise<void> {
    // console.time('Non-Critical Modules Preload Time');
    const manifest = await this.getManifest();
    let delay = 300; // Initial delay (in milliseconds)
    
    // Group modules by remoteEntry to reduce connection overhead
    const modulesByRemoteEntry = new Map();
    
    for (const key in manifest) {
      const remoteConfig = manifest[key];
      if (remoteConfig.subModule && Array.isArray(remoteConfig.subModule)) {
        if (!modulesByRemoteEntry.has(remoteConfig.remoteEntry)) {
          modulesByRemoteEntry.set(remoteConfig.remoteEntry, []);
        }
        
        for (const subModule of remoteConfig.subModule) {
          // Only preload pinned modules that are NOT critical
          if (subModule.pinned && !subModule.critical) {
            const moduleId = `${remoteConfig.remoteEntry}:${subModule.exposedModule}`;
            
            // Skip if already loaded
            if (this.loadedModules.has(moduleId)) {
              continue;
            }
            
            modulesByRemoteEntry.get(remoteConfig.remoteEntry).push({
              remoteEntry: remoteConfig.remoteEntry,
              ...subModule,
              moduleId
            });
          }
        }
      }
    }
    
    // Process modules in batches grouped by remoteEntry
    for (const [remoteEntry, modules] of modulesByRemoteEntry) {
      setTimeout(() => {
        this.loadModuleBatch(modules);
      }, delay);
      delay += 500; // Increase delay between different remoteEntry batches
    }
    
    // console.timeEnd('Non-Critical Modules Preload Time');
  }
  
  private async loadModuleBatch(modules: any[]): Promise<void> {
    const batchPromises = modules.map(module => {
      return loadRemoteModule({
        type: 'module',
        remoteEntry: module.remoteEntry,
        exposedModule: module.exposedModule,
      })
      .then(() => {
        this.loadedModules.add(module.moduleId);
        // console.log(`✅ Preloaded non-critical module: ${module.exposedModule}`);
      })
      .catch((err) => {
        console.error(`❌ Error preloading non-critical module ${module.exposedModule}:`, err);
      });
    });
    
    await Promise.all(batchPromises);
  }
  
  // Utility method to check if a module is loaded
  isModuleLoaded(remoteEntry: string, exposedModule: string): boolean {
    const moduleId = `${remoteEntry}:${exposedModule}`;
    return this.loadedModules.has(moduleId);
  }
}