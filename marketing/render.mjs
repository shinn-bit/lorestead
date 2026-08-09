// ════════════════════════════════════════════════════════════════
//  Renderer — builds each spec's HTML and screenshots it to out/<id>.png
//
//  Usage:
//    node render.mjs                 # render every image
//    node render.mjs hero-landscape  # render only the named id(s)
//    node render.mjs --list          # list ids + final pixel sizes
// ════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import puppeteer from 'puppeteer';
import { IMAGES } from './images.js';
import { buildHtml, buildSequenceHtml } from './src/template.js';
import { shot, still, shotPath, stillPath } from './src/assets.js';
import { basename } from 'node:path';

// Resolve a spec's screenshots into data URIs. Returns null (→ skip) if any
// referenced file is missing, listing what's absent, so the run continues.
function resolveAssets(spec) {
  const missing = [];
  const out = { ...spec };
  if (spec.device?.screenshot) {
    const src = shot(spec.device.screenshot);
    if (!src) missing.push(basename(shotPath(spec.device.screenshot)));
    out.device = { ...spec.device, src };
  }
  if (spec.stills) {
    out.stills = spec.stills.map((s) => {
      const src = still(s.world, s.stage);
      if (!src) missing.push(basename(stillPath(s.world, s.stage)));
      return { ...s, src };
    });
  }
  return missing.length ? { missing } : out;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, 'out');
const DEBUG_HTML = process.env.DEBUG_HTML === '1';

const args = process.argv.slice(2);
if (args.includes('--list')) {
  for (const s of IMAGES) {
    const sc = s.scale || 1;
    console.log(`  ${s.id.padEnd(22)} ${s.width * sc}×${s.height * sc}px  (${s.kind}, ${s.palette})`);
  }
  process.exit(0);
}

const wanted = args.filter((a) => !a.startsWith('--'));
const specs = wanted.length ? IMAGES.filter((s) => wanted.includes(s.id)) : IMAGES;
if (!specs.length) {
  console.error(`No matching image ids. Available: ${IMAGES.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
let rendered = 0, skipped = 0;
try {
  for (const rawSpec of specs) {
    const resolved = resolveAssets(rawSpec);
    if (resolved.missing) {
      console.log(`  ⤫ ${rawSpec.id.padEnd(22)} skipped — missing: ${resolved.missing.join(', ')}`);
      skipped++;
      continue;
    }
    const spec = resolved;
    const scale = spec.scale || 1;
    const html = spec.kind === 'sequence' ? buildSequenceHtml(spec) : buildHtml(spec);
    if (DEBUG_HTML) writeFileSync(resolve(OUT, `${spec.id}.html`), html);

    const page = await browser.newPage();
    await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => { await document.fonts.ready; });

    const file = resolve(OUT, `${spec.id}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: spec.width, height: spec.height } });
    await page.close();
    rendered++;
    console.log(`  ✓ ${spec.id.padEnd(22)} → out/${spec.id}.png  (${spec.width * scale}×${spec.height * scale})`);
  }
} finally {
  await browser.close();
}
console.log(`\nDone — ${rendered} rendered${skipped ? `, ${skipped} skipped (missing screenshots)` : ''} → ${OUT}`);
