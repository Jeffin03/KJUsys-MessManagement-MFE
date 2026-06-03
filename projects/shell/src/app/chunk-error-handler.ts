import { ErrorHandler, Injectable } from '@angular/core';

// Minimum time between auto-reloads. Prevents infinite reload loops if the
// remote is genuinely broken after a fresh load.
const RELOAD_COOLDOWN_MS = 30_000;
const RELOAD_TS_KEY = 'chunk_error_reload_ts';

// Clear any inherited cooldown timestamp on non-reload navigations.
// Browser tab duplication clones sessionStorage, so a duplicated tab inherits
// the source tab's timestamp and would get a blank screen (toast only, no reload)
// instead of the expected auto-reload recovery. navType 'reload' means this IS
// our own window.location.reload() — keep the timestamp. Anything else
// ('navigate', 'back_forward', or undefined if the API is unavailable) — clear it
// so each tab manages its own cooldown independently.
const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
if (navEntry?.type !== 'reload') {
  sessionStorage.removeItem(RELOAD_TS_KEY);
}

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const err = error as any;
    // Zone.js wraps unhandled promise rejections — unwrap if needed.
    const actual = err?.rejection ?? err?.ngOriginalError ?? err;
    const msg: string = actual?.message ?? '';
    const name: string = actual?.name ?? '';

    // "Failed to fetch dynamically imported module: .../remoteEntry.js" fires when
    // the remote dev-server is simply not running — not a stale-cache problem.
    // Only reload for actual webpack ChunkLoadErrors or for chunk URLs (not remoteEntry).
    const isRemoteEntryFailure =
      (msg.includes('error loading dynamically imported module') ||
        msg.includes('Failed to fetch dynamically imported module')) &&
      msg.includes('remoteEntry');

    const isLoadError =
      !isRemoteEntryFailure &&
      (name === 'ChunkLoadError' ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('Failed to fetch dynamically imported module'));

    if (isLoadError) {
      const lastReloadTs = parseInt(sessionStorage.getItem(RELOAD_TS_KEY) ?? '0', 10);
      const now = Date.now();

      if (now - lastReloadTs > RELOAD_COOLDOWN_MS) {
        // Stamp before reload so the flag survives into the new page load.
        // With HashLocationStrategy the address bar already shows the target
        // route at this point (Angular updates it on NavigationStart, before
        // the lazy module finishes loading), so a plain reload retries the
        // exact route the user wanted without any extra navigation.
        sessionStorage.setItem(RELOAD_TS_KEY, String(now));
        window.location.reload();
        return;
      }
      // Still failing within the cooldown window — the remote is genuinely
      // unavailable. Notify the UI so the user gets an actionable message
      // instead of a frozen screen.
      window.dispatchEvent(new CustomEvent('mfe:chunk-load-failed'));
    }

    console.error(error);
  }
}
