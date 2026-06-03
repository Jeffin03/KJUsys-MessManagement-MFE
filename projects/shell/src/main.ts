import 'zone.js';
import { loadManifest } from '@angular-architects/module-federation';
import { environment } from './environments/environment';


// Clear any stale browser cache/storage from old projects on startup
try {
  localStorage.clear();
  sessionStorage.clear();
} catch (e) {
  console.warn('Failed to clear storage:', e);
}

loadManifest(environment.manifestPath || '/assets/mf.manifest.json', true)
  .catch((err) => {
    console.warn('Manifest load failed, retrying once...', err);
    return loadManifest(environment.manifestPath || '/assets/mf.manifest.json', true);
  })
  .then((_) => import('./bootstrap'))
  .catch((err) => {
    console.error('Application failed to load:', err);
    document.body.innerHTML =
      '<div style="padding:2rem;font-family:sans-serif;text-align:center">' +
      '<p>Failed to load application resources.</p>' +
      '<p><a href="javascript:location.reload()" style="color:#1976d2">Click here to retry</a></p>' +
      '</div>';
  });