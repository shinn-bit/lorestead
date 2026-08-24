// Resolve app screenshots / stills and inline them as data URIs so the
// generated HTML is fully self-contained (portable, no file:// juggling).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..');           // repo root
export const SHOTS = resolve(REPO, 'frontend', 'screenshot');
export const WORLDS = resolve(REPO, 'frontend', 'public', 'assets', 'worlds');

/**
 * Read an image file and return a data URI, or `null` if the file is
 * missing (render.mjs skips any spec with a missing asset, so the set
 * still builds from whatever screenshots are ready). Pass throwOnMissing
 * to fail loudly instead.
 */
export function dataUri(absPath, throwOnMissing = false) {
  if (!existsSync(absPath)) {
    if (throwOnMissing) throw new Error(`Missing asset: ${absPath}`);
    return null;
  }
  const ext = absPath.split('.').pop().toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${readFileSync(absPath).toString('base64')}`;
}

export const shotPath  = (name) => resolve(SHOTS, name);
export const stillPath = (world, stage) => resolve(WORLDS, world, 'stills', `stage_0${stage}.png`);
export const shot  = (name) => dataUri(shotPath(name));
export const still = (world, stage) => dataUri(stillPath(world, stage));
