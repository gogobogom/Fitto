#!/usr/bin/env node
/**
 * build-mobile.js
 *
 * Temporarily moves server-only routes (API routes, force-dynamic pages,
 * middleware) out of `src/` so Next.js can run `output: 'export'` for
 * Capacitor (iOS/Android). Restores everything once the build completes,
 * even if the build fails.
 *
 * Usage:
 *   node scripts/build-mobile.js
 *
 * Equivalent to: `MOBILE_BUILD=true next build`, but with server-only code
 * stashed away to satisfy the static export constraints.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const STASH = path.join(ROOT, '.mobile-build-stash');

// Paths (relative to repo root) that must be removed from `src/` during
// static export. They get moved into `.mobile-build-stash/` and restored
// when the build finishes.
const SERVER_ONLY_PATHS = [
  'src/app/api',
  'src/app/share',          // contains force-dynamic route handlers
  'src/middleware.ts',
];

// Files that need to be temporarily replaced with a static-export-safe
// version (their server-only bits, e.g. `cookies()`, would otherwise force
// dynamic rendering on every route).
const LAYOUT_PATH = 'src/app/layout.tsx';

function log(msg) {
  console.log(`[build-mobile] ${msg}`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stash() {
  ensureDir(STASH);
  const moved = [];
  for (const rel of SERVER_ONLY_PATHS) {
    const from = path.join(ROOT, rel);
    if (!fs.existsSync(from)) continue;
    const to = path.join(STASH, rel);
    ensureDir(path.dirname(to));
    fs.renameSync(from, to);
    moved.push(rel);
    log(`stashed ${rel}`);
  }
  return moved;
}

function patchLayout() {
  const layoutAbs = path.join(ROOT, LAYOUT_PATH);
  if (!fs.existsSync(layoutAbs)) return false;
  const original = fs.readFileSync(layoutAbs, 'utf8');
  if (!/from\s+["']next\/headers["']/.test(original)) {
    return false;
  }
  const stashedLayout = path.join(STASH, LAYOUT_PATH);
  ensureDir(path.dirname(stashedLayout));
  fs.writeFileSync(stashedLayout, original);

  // Strip `next/headers` imports and any `cookies()` usage so the root
  // layout can be statically rendered for the mobile export. Replace the
  // async function signature with a sync one as well. Also remove the
  // ResponseLogger (uses `useSearchParams` and posts to `/api/logger`,
  // both unavailable in a static export).
  let patched = original
    .replace(/^\s*import\s*\{[^}]*\}\s*from\s*["']next\/headers["'];?\s*$/gm, '')
    .replace(/^\s*import\s*\{\s*ResponseLogger\s*\}\s*from\s*["']@\/components\/response-logger["'];?\s*$/gm, '')
    .replace(/^\s*const\s+cookieStore\s*=\s*await\s+cookies\(\);\s*$/gm, '')
    .replace(/^\s*const\s+requestId\s*=\s*cookieStore[^;]*;\s*$/gm, 'const requestId = undefined;')
    .replace(/<\s*ResponseLogger\s*\/>\s*/g, '')
    .replace(/export\s+default\s+async\s+function\s+RootLayout/, 'export default function RootLayout');

  fs.writeFileSync(layoutAbs, patched);
  log(`patched ${LAYOUT_PATH} (removed next/headers usage)`);
  return true;
}

function restoreLayout() {
  const stashedLayout = path.join(STASH, LAYOUT_PATH);
  const layoutAbs = path.join(ROOT, LAYOUT_PATH);
  if (!fs.existsSync(stashedLayout)) return;
  fs.copyFileSync(stashedLayout, layoutAbs);
  fs.rmSync(stashedLayout, { force: true });
  log(`restored ${LAYOUT_PATH}`);
}

function restore(moved) {
  for (const rel of moved) {
    const from = path.join(STASH, rel);
    const to = path.join(ROOT, rel);
    if (!fs.existsSync(from)) continue;
    ensureDir(path.dirname(to));
    // If something exists at destination (shouldn't), remove it first
    if (fs.existsSync(to)) {
      fs.rmSync(to, { recursive: true, force: true });
    }
    fs.renameSync(from, to);
    log(`restored ${rel}`);
  }
  // Clean up the stash dir if empty
  try {
    fs.rmSync(STASH, { recursive: true, force: true });
  } catch (_) {
    /* ignore */
  }
}

let moved = [];

function cleanupAndExit(code) {
  try {
    restoreLayout();
  } catch (err) {
    log(`layout restore failed: ${err && err.message ? err.message : err}`);
  }
  try {
    restore(moved);
  } catch (err) {
    log(`restore failed: ${err && err.message ? err.message : err}`);
  }
  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(130));
process.on('SIGTERM', () => cleanupAndExit(143));

try {
  if (!fs.existsSync(SRC)) {
    throw new Error(`src directory not found at ${SRC}`);
  }

  log('preparing static export build...');
  moved = stash();
  patchLayout();

  const result = spawnSync('npx', ['next', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, MOBILE_BUILD: 'true' },
  });

  cleanupAndExit(result.status ?? 1);
} catch (err) {
  log(`error: ${err && err.message ? err.message : err}`);
  cleanupAndExit(1);
}
