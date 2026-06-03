const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ─── CLI flag parsing ─────────────────────────────────────────────────────────
// Flags must come before commands: --cooldown=<ms>  --headroom=<mb>
// Example (lib builds): node dynamic-build.js --cooldown=3000 --headroom=512 "ng build @libs/foo"
const rawArgs = process.argv.slice(2);
const flags = {};
const commands = rawArgs.filter(arg => {
  const m = arg.match(/^--(\w+)=(\S+)$/);
  if (m) { flags[m[1]] = m[2]; return false; }
  return true;
});
if (commands.length === 0) {
  console.error('No commands provided to run.');
  process.exit(1);
}

// ─── Scheduler configuration ──────────────────────────────────────────────────
// Minimum free RAM that must be available before the next build is spawned.
// The build machine has ~15.7 GB total RAM with ~8–9 GB free at idle.
// Most Angular builds peak at 3–4 GB; one project has been observed near 8 GB.
// 3.5 GB threshold allows 2–3 concurrent builds before RAM is fully committed,
// while the heavy 8 GB build naturally starves out new spawns as it ramps up.
// Override with --headroom=<mb> for lighter workloads (e.g. library builds).
const SAFE_HEADROOM_MB = Number(flags.headroom ?? 5120);

// How long to wait after each spawn before allowing the next one.
// The cooldown's job is to give the new process time to begin consuming RAM
// so the headroom check reads an accurate free-RAM figure before the next
// spawn decision. SAFE_HEADROOM_MB is the primary OOM guard; this is secondary.
// Values are per-project based on source size — see profileForProject below.
// Override all projects with --cooldown=<ms> (e.g. lib builds use --cooldown=1000).
const HEAVY_COOLDOWN_MS = 20_000;  // heavy projects ramp slowly on cold builds
const LIGHT_COOLDOWN_MS =  5_000;  // light projects register RAM in ~3 s even cold

// How often the scheduler checks whether a new build can be started.
const POLL_INTERVAL_MS = 5_000;

// Never run more parallel builds than (CPU count - 1), keeping one core free
// for the OS and scheduler overhead.
const CPU_CAP = Math.max(1, os.cpus().length - 1);

// ─── Dynamic heap sizing ──────────────────────────────────────────────────────
// Rather than a hardcoded list of "heavy" projects, the scheduler measures each
// project's source directory at spawn time and picks the appropriate V8 ceiling.
// New projects and size changes are handled automatically without editing this file.
//
// Thresholds (MB of source files, excluding node_modules / dist / dotfiles):
//   ≥ HEAVY_THRESHOLD_MB  →  HEAVY_HEAP_MB   (e.g. shell, admissions, fees …)
//   <  HEAVY_THRESHOLD_MB  →  LIGHT_HEAP_MB   (e.g. arena, portal, guesthouse …)
const HEAVY_THRESHOLD_MB = 15;
const HEAVY_HEAP_MB      = 4096;
const LIGHT_HEAP_MB      = 2048;

const REPO_ROOT   = path.join(__dirname, '..');
const SKIP_DIRS   = new Set(['node_modules', 'dist', '.git', '.angular']);
const profileCache = new Map(); // projectName → { heapMB, cooldownMs }, computed once per run

function sourceDirBytes(dir) {
  let total = 0;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      total += entry.isDirectory() ? sourceDirBytes(full) : fs.statSync(full).size;
    }
  } catch (_) {}
  return total;
}

function profileForProject(label) {
  // label examples: "build:shell", "build:admissions", "@libs/http-common"
  const projectName = label.startsWith('@libs/')
    ? label.slice('@libs/'.length)
    : label.split(':').pop().split('/').pop();

  if (profileCache.has(projectName)) return profileCache.get(projectName);

  // Resolve project source directory — app projects first, then libs.
  let projectDir = path.join(REPO_ROOT, 'projects', projectName);
  if (!fs.existsSync(projectDir))
    projectDir = path.join(REPO_ROOT, 'projects', 'libs', projectName);

  const sizeMB  = sourceDirBytes(projectDir) / (1024 * 1024);
  const isHeavy = sizeMB >= HEAVY_THRESHOLD_MB;
  const profile = {
    heapMB:     isHeavy ? HEAVY_HEAP_MB     : LIGHT_HEAP_MB,
    cooldownMs: isHeavy ? HEAVY_COOLDOWN_MS : LIGHT_COOLDOWN_MS,
  };
  profileCache.set(projectName, profile);
  return profile;
}

// ─── State ────────────────────────────────────────────────────────────────────
const queue = [...commands];
const activeChildren = new Set();
const childMeta = new Map();   // child → { cmd, startTime }
let lastSpawnTime = 0;
let activeCooldownMs = HEAVY_COOLDOWN_MS; // safe default; overwritten after each spawn
let completed = 0;
let failed = 0;
const total = commands.length;
let shuttingDown = false;
let isWaiting = false;   // tracks waiting→ready transition to avoid log spam
const overallStart = Date.now();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const freeMB = () => os.freemem() / (1024 * 1024);
const freeGB = () => (freeMB() / 1024).toFixed(1);

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

// Always start on a fresh line so scheduler messages don't get spliced into
// Angular CLI's spinner output (which uses \r to overwrite the current line).
function slog(msg) {
  process.stderr.write(`\n${msg}\n`);
}

// ─── Core scheduler ───────────────────────────────────────────────────────────
function trySpawnNext() {
  if (shuttingDown) return;
  if (queue.length === 0) return;
  if (activeChildren.size >= CPU_CAP) return;

  // Enforce cooldown so the previous build has time to ramp up its memory
  // before we decide whether there is room for another one.
  const msSinceLastSpawn = Date.now() - lastSpawnTime;
  if (lastSpawnTime > 0 && msSinceLastSpawn < activeCooldownMs) {
    if (!isWaiting) {
      isWaiting = true;
      const remaining = Math.ceil((activeCooldownMs - msSinceLastSpawn) / 1000);
      slog(`[scheduler] Cooldown — next spawn in ~${remaining}s`);
    }
    return;
  }

  // Only spawn if the OS actually has enough free RAM right now.
  const currentFreeMB = freeMB();
  if (currentFreeMB < SAFE_HEADROOM_MB) {
    if (!isWaiting) {
      isWaiting = true;
      slog(`[scheduler] Waiting — free RAM ${freeGB()}GB < ${SAFE_HEADROOM_MB / 1024}GB threshold`);
    }
    return;
  }

  // Conditions met — clear waiting flag before spawning.
  if (isWaiting) {
    isWaiting = false;
    slog(`[scheduler] Resuming — free RAM ${freeGB()}GB, spawning next build`);
  }

  const cmd = queue.shift();
  const spawnTime = Date.now();
  lastSpawnTime = spawnTime;

  // Extract a readable label from the command (last word, e.g. "build:academics").
  const label = cmd.trim().split(/\s+/).pop();
  const { heapMB, cooldownMs } = profileForProject(label);
  // --cooldown flag overrides dynamic per-project cooldown for all builds in this run
  activeCooldownMs = flags.cooldown != null ? Number(flags.cooldown) : cooldownMs;

  slog(`[+] Starting  ${label} | heap: ${heapMB}MB | cooldown: ${activeCooldownMs / 1000}s | running: ${activeChildren.size + 1} | queued: ${queue.length} | free RAM: ${freeGB()}GB`);

  const child = spawn(cmd, {
    shell: true,
    stdio: 'inherit',
    // detached creates its own process group so SIGINT/SIGTERM can kill the
    // entire subtree (ng → webpack → tsc workers) with process.kill(-pid, sig).
    detached: true,
    env: { ...process.env, NODE_OPTIONS: `--max_old_space_size=${heapMB}` },
  });

  activeChildren.add(child);
  childMeta.set(child, { label, startTime: spawnTime });

  child.on('close', (code) => {
    const { label: l, startTime } = childMeta.get(child) || {};
    childMeta.delete(child);
    activeChildren.delete(child);
    completed++;

    const duration = formatDuration(Date.now() - startTime);

    if (code !== 0) {
      failed++;
      slog(`[✗] ${l}  ${duration} | FAILED (exit ${code}) — aborting ${activeChildren.size} running + ${queue.length} queued build(s)`);
      killAll('SIGTERM');
      checkDone();
      return;
    }

    slog(`[✓] ${l}  ${duration} | completed: ${completed}/${total} | queued: ${queue.length}`);
    trySpawnNext();
    checkDone();
  });

  child.on('error', (err) => {
    const { label: l } = childMeta.get(child) || {};
    childMeta.delete(child);
    activeChildren.delete(child);
    completed++;
    failed++;
    slog(`[✗] Failed to start ${l}: ${err.message} — aborting ${activeChildren.size} running + ${queue.length} queued build(s)`);
    killAll('SIGTERM');
  });
}

function checkDone() {
  if (activeChildren.size === 0 && queue.length === 0) {
    clearInterval(pollTimer);
    if (shuttingDown) {
      process.exit(1);
      return;
    }
    slog('======================================================');
    slog(`Build complete: ${completed - failed}/${total} succeeded, ${failed} failed`);
    slog(`Total time:     ${formatDuration(Date.now() - overallStart)}`);
    slog('======================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

// ─── Signal forwarding ────────────────────────────────────────────────────────
// Negative PID targets the entire process group, killing ng + webpack + workers.
function killAll(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  // Stop the poll loop and drain the queue so close-event callbacks cannot
  // trigger new spawns after children exit.
  clearInterval(pollTimer);
  queue.length = 0;

  slog(`[scheduler] Shutting down — stopping ${activeChildren.size} active build(s)...`);

  for (const child of activeChildren) {
    try { process.kill(-child.pid, signal); } catch (_) {}
  }

  // If nothing was running, exit immediately.
  if (activeChildren.size === 0) process.exit(1);

  // Safety net: force exit if a child hangs and never emits 'close'.
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT',  () => killAll('SIGINT'));
process.on('SIGTERM', () => killAll('SIGTERM'));

// ─── Startup banner ───────────────────────────────────────────────────────────
console.log('\n======================================================');
console.log('------------ Adaptive Build Scheduler ---------------');
console.log('======================================================');
console.log(`System:    ${os.cpus().length} cores, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB RAM`);
console.log(`Free now:  ${freeGB()}GB`);
console.log(`CPU cap:   ${CPU_CAP} parallel build(s) max`);
console.log(`Headroom:  ${SAFE_HEADROOM_MB / 1024}GB free RAM required before each spawn`);
const cooldownBanner = flags.cooldown != null
  ? `${Number(flags.cooldown) / 1000}s (all, --cooldown override)`
  : `${HEAVY_COOLDOWN_MS / 1000}s (heavy) / ${LIGHT_COOLDOWN_MS / 1000}s (light)`;
console.log(`Cooldown:  ${cooldownBanner}`);
console.log(`Heap cap:  4096MB (heavy projects) / 2048MB (light projects)`);
console.log(`Builds:    ${total} queued`);
console.log('======================================================\n');

// ─── Start ────────────────────────────────────────────────────────────────────
// Kick off immediately, then poll every 2s for subsequent spawn decisions.
const pollTimer = setInterval(() => {
  trySpawnNext();
  checkDone();
}, POLL_INTERVAL_MS);

trySpawnNext();
