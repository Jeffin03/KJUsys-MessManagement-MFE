const GIST_RAW_URL = 'https://gist.githubusercontent.com/Jeffin03/36caacb312bffd2e7430d452f875923d/raw/gistfile1.txt';

const LS_KEY = 'kjusys_backendUrl';
const DEV_MODE_KEY = 'kjusys_devMode';
const LOCALHOST_URL = 'http://localhost:8080';
const PROBE_TIMEOUT_MS = 3000;

export type ResolvedSource = 'devMode' | 'gist' | 'cached' | 'localhost' | 'environment';

class ConfigLoaderService {
  private _resolvedUrl: string | null = null;
  private _resolvedSource: ResolvedSource = 'environment';

  get resolvedUrl(): string | null {
    return this._resolvedUrl;
  }

  get resolvedSource(): ResolvedSource {
    return this._resolvedSource;
  }

  // Synchronous load to block execution until config is fetched, 
  // avoiding top-level await issues in Webpack without modifying other files.
  load(environmentObj: any): void {
    if (this.isDevMode()) {
      this._resolvedUrl = LOCALHOST_URL;
      this._resolvedSource = 'devMode';
      console.info('[ConfigLoader] Dev Mode ON → using localhost:8080');
      this.updateEnvironment(environmentObj, LOCALHOST_URL);
      return;
    }

    if (!GIST_RAW_URL) {
      this._resolvedUrl = localStorage.getItem(LS_KEY);
      this._resolvedSource = this._resolvedUrl ? 'cached' : 'environment';
      if (this._resolvedUrl) this.updateEnvironment(environmentObj, this._resolvedUrl);
      return;
    }

    let gistUrl: string | null = null;

    try {
      const freshUrl = `${GIST_RAW_URL}?t=${Date.now()}`;
      const response = this.syncRequest(freshUrl);
      if (response.status === 200) {
        const text = response.text;
        try {
          const parsed = JSON.parse(text);
          gistUrl = (parsed && (parsed.backendUrl || parsed.backend_url)) ? (parsed.backendUrl || parsed.backend_url).trim() : (text.trim() || null);
        } catch {
          gistUrl = text.trim() || null;
        }
      }
    } catch {
      console.warn('[ConfigLoader] Gist unreachable, will try cached / localhost fallback.');
    }

    const candidateUrl = gistUrl || localStorage.getItem(LS_KEY) || LOCALHOST_URL;

    // 1. USE IMMEDIATELY (No waiting)
    this._resolvedUrl = candidateUrl;
    this._resolvedSource = gistUrl ? 'gist' : (localStorage.getItem(LS_KEY) ? 'cached' : 'localhost');
    this.updateEnvironment(environmentObj, candidateUrl);
    console.info(`[ConfigLoader] Applied ${this._resolvedSource} URL immediately: ${candidateUrl}`);

    // 2. BACKGROUND PROBE (Does not block)
    this.runBackgroundProbe(candidateUrl, environmentObj);
  }

  private async runBackgroundProbe(candidateUrl: string, environmentObj: any) {
    console.info(`[ConfigLoader] Running background probe for: ${candidateUrl}`);
    const isAlive = await this.probeServerAsync(candidateUrl);

    if (isAlive) {
      localStorage.setItem(LS_KEY, candidateUrl);
      console.info(`[ConfigLoader] Background probe successful for ${candidateUrl}. Saved to cache.`);
      return;
    }

    console.warn(`[ConfigLoader] Background probe failed for ${candidateUrl}. Trying localhost...`);
    const isLocalAlive = await this.probeServerAsync(LOCALHOST_URL);

    if (isLocalAlive) {
      localStorage.setItem(LS_KEY, LOCALHOST_URL);
      console.info(`[ConfigLoader] Localhost is alive. Saved to cache for the next hard refresh.`);
    } else {
      console.error(`[ConfigLoader] Both candidate and localhost probes failed.`);
    }
  }

  private updateEnvironment(envObj: any, baseUrl: string) {
    if (envObj) {
      envObj.baseUrl = `${baseUrl}/kjusys-api/mess-management`;
    }
  }

  private syncRequest(url: string): { status: number, text: string } {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return { status: xhr.status, text: xhr.responseText };
  }

  private async probeServerAsync(baseUrl: string): Promise<boolean> {
    try {
      const healthUrl = `${baseUrl}/kjusys-api/mess-management/health`;
      const response = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
      return response.ok || response.status === 404;
    } catch {
      return false;
    }
  }

  isDevMode(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const flag = localStorage.getItem(DEV_MODE_KEY);
    return flag === 'true' || flag === '1';
  }

  setDevMode(enabled: boolean): void {
    if (enabled) {
      localStorage.setItem(DEV_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(DEV_MODE_KEY);
    }
  }
}

export const configLoader = new ConfigLoaderService();
