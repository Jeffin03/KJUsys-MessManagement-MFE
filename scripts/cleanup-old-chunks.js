#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const distDir = process.argv[2];
const GRACE_PERIOD_MS = parseInt(process.argv[3] ?? '5400', 10) * 1000;

if (!distDir) {
  console.error('Usage: cleanup-old-chunks.js <dist-dir> [grace-period-seconds]');
  process.exit(1);
}

// Matches content-hashed filenames produced by webpack:
//   main.abcd1234ef.js, 1626.b7b6bf20eb57.js, _68f20.js
// and their gzip pairs (*.js.gz, *.css.gz)
const HASHED = /(?:\.[0-9a-f]{8,}\.|_[0-9a-f]{5,}\.(?:js|css)(\.gz)?$)/i;

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

// Collect every hashed chunk filename referenced by any index.html in the dist tree.
// Guards against deleting chunks that are shared across builds (same content → same hash →
// rsync leaves the old mtime untouched, so they look old even though the live build needs them).
function referencedFilenames(distDir) {
  const names = new Set();
  for (const f of walk(distDir)) {
    if (!f.endsWith('index.html')) continue;
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/["']([^"']*\.[0-9a-f]{8,}\.[^"']+)["']/gi)) {
      names.add(path.basename(m[1].replace(/\?.*$/, '')));
    }
  }
  return names;
}

function runCleanup() {
  const now = Date.now();
  console.log(`[${new Date(now).toISOString()}] Starting orphaned chunk cleanup`);
  console.log(`  dist:         ${distDir}`);
  console.log(`  grace period: ${GRACE_PERIOD_MS / 60000} min`);

  const referenced = referencedFilenames(distDir);
  let deleted = 0, keptLive = 0, tooYoung = 0;

  for (const f of walk(distDir)) {
    const base = path.basename(f);
    const unzipped = base.endsWith('.gz') ? base.slice(0, -3) : base;
    if (!HASHED.test(unzipped)) continue;

    // Never delete a chunk the live build references, regardless of age.
    if (referenced.has(unzipped) || referenced.has(base)) { keptLive++; continue; }

    const stat = fs.statSync(f);
    const ageMs = now - stat.mtimeMs;

    if (ageMs < GRACE_PERIOD_MS) { tooYoung++; continue; }

    try {
      fs.unlinkSync(f);
      deleted++;
      console.log(`  deleted (age ${Math.round(ageMs / 60000)}min): ${path.relative(distDir, f)}`);
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn(`  could not delete ${f}:`, e.message);
    }
  }

  console.log(
    `[${new Date().toISOString()}] Done.` +
    ` deleted=${deleted} kept-live=${keptLive} too-young=${tooYoung}`
  );
}

runCleanup();
