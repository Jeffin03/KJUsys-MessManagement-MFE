const path = require('path');

// Matches dot-separated hashes (main.abcd1234.js) and underscore-separated
// short hashes produced by webpack module federation chunks (_68f20.js).
const HASHED_ASSET_PATTERN = /(?:\.[0-9a-f]{8,}\.|_[0-9a-f]{5,}\.(?:js|css)$)/i;
const NO_STORE_FILES = new Set([
  'index.html',
  'remoteEntry.js',
  'manifest.webmanifest',
  'ngsw.json',
]);

function setStaticCacheHeaders(res, filePath) {
  const raw = path.basename(filePath);
  const fileName = raw.endsWith('.gz') ? raw.slice(0, -3) : raw;

  if (NO_STORE_FILES.has(fileName)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return;
  }

  if (HASHED_ASSET_PATTERN.test(fileName)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
}

module.exports = {
  setStaticCacheHeaders,
};