const fs = require('fs');
const path = require('path');

const version = Date.now();
const root = path.join(__dirname, '..');

const jsonFiles = [
  'projects/shell/src/assets/mf.manifest.dev.json',
  'projects/shell/src/assets/mf.manifest.prod.json',
];

const tsFiles = [
  'projects/shell/src/environments/environment.dev.ts',
  'projects/shell/src/environments/environment.prod.ts',
];

// Matches either the placeholder or a previously injected timestamp so
// re-running the build without a clean checkout works correctly.
const JSON_RE = /remoteEntry\.js\?v=(?:__BUILD_VERSION__|\d+)/g;
const TS_RE   = /(mf\.manifest[^'"]*\.json\?v=)(?:__BUILD_VERSION__|\d+)/g;

jsonFiles.forEach((relative) => {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) return;
  const updated = fs.readFileSync(file, 'utf8')
    .replace(JSON_RE, `remoteEntry.js?v=${version}`);
  fs.writeFileSync(file, updated);
  console.log(`[inject-build-version] ${relative} → v=${version}`);
});

tsFiles.forEach((relative) => {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) return;
  const updated = fs.readFileSync(file, 'utf8')
    .replace(TS_RE, `$1${version}`);
  fs.writeFileSync(file, updated);
  console.log(`[inject-build-version] ${relative} → v=${version}`);
});
