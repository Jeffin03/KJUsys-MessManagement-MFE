import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {
  private initialBuildTime: string | null = null;

  constructor() {
    // Store initial version on app load
    this.captureInitialVersion();
  }

  private async captureInitialVersion(): Promise<void> {
    try {
      const buildTime = await this.fetchBuildTime();
      this.initialBuildTime = buildTime;
      console.log('📦 App version captured:', buildTime);
    } catch (error) {
      console.warn('Could not capture initial version:', error);
    }
  }

  private async fetchBuildTime(): Promise<string | null> {
    try {
      // Add cache-busting timestamp to always get fresh version.json
      const response = await fetch(`/assets/version.json?t=${Date.now()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch version.json: ${response.status}`);
      }
      
      const data = await response.json();
      return data.buildTime || null;
    } catch (error) {
      console.error('Error fetching version.json:', error);
      return null;
    }
  }

  /**
   * Check if a new version has been deployed since the app was loaded.
   * Call this before critical navigation (like after login).
   * @returns true if a new version is detected and reload is needed
   */
  async hasNewVersionDeployed(): Promise<boolean> {
    if (this.initialBuildTime === null) {
      // No initial version captured, can't compare
      return false;
    }

    try {
      const currentBuildTime = await this.fetchBuildTime();
      
      if (currentBuildTime === null) {
        return false;
      }

      const hasNewVersion = this.initialBuildTime !== currentBuildTime;
      
      if (hasNewVersion) {
        console.log('🔄 New version detected!', {
          initial: this.initialBuildTime,
          current: currentBuildTime
        });
      }
      
      return hasNewVersion;
    } catch (error) {
      console.error('Version check failed:', error);
      return false;
    }
  }

  /**
   * Force reload the page if a new version is detected.
   * Clears sessionStorage before reload to ensure fresh state.
   */
  async reloadIfNewVersion(): Promise<boolean> {
    const needsReload = await this.hasNewVersionDeployed();
    
    if (needsReload) {
      console.log('🔄 Reloading to get new version...');
      // Clear all cached state
      sessionStorage.clear();
      // Force hard reload bypassing browser cache
      window.location.reload();
      return true;
    }
    
    return false;
  }
}
