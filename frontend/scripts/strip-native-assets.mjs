// ════════════════════════════════════════════════════════════════
//  Strips world videos out of dist/ before `cap sync`.
//
//  The native shell reads every world video from CloudFront
//  (VITE_ASSET_BASE), so the copies Vite pastes out of public/ are
//  dead weight — ~514 MB of it, which is far past Play's download
//  size limit. Stills stay: they are tiny and act as the fallback
//  when VITE_ASSET_BASE is unset.
//
//  Usage: node scripts/strip-native-assets.mjs   (run after vite build)
// ════════════════════════════════════════════════════════════════

import { readdirSync, statSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const worldsDir = join(root, 'dist', 'assets', 'worlds');

let removed = 0;
let bytes = 0;

function strip(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      strip(path);
    } else if (entry.name.endsWith('.mp4')) {
      bytes += statSync(path).size;
      rmSync(path);
      removed++;
    }
  }
}

try {
  statSync(worldsDir);
} catch {
  console.log('strip-native-assets: no dist/assets/worlds — nothing to strip.');
  process.exit(0);
}

strip(worldsDir);
console.log(
  `strip-native-assets: removed ${removed} video(s), ${(bytes / 1024 / 1024).toFixed(1)} MB.`
);
