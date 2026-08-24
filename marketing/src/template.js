// ════════════════════════════════════════════════════════════════
//  Template builder — turns one image spec into a full HTML page that
//  Puppeteer screenshots. Layout mirrors the note-TREE promo structure
//  (wordmark → headline+subcopy → device mock → footer caption/CTA) and
//  is styled with the app's own design system (see theme.js).
//
//  Layouts:
//    split     text column + device column   (landscape hero, App Store)
//    stacked   headline on top, device below (square / portrait)
//    showcase  device dominant, caption only (App Store feature shots)
//    sequence  filmstrip of world stills     (stage-growth shot)  ← buildSequenceHtml
// ════════════════════════════════════════════════════════════════

import { hearthlight as H, parchment as P, fonts, FONT_LINK, NOISE_SVG } from './theme.js';
import { FRAME_CSS, renderFrame } from './frames.js';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// palette → resolved colour set
function colors(palette) {
  const dark = palette !== 'light';
  return dark
    ? { dark, bg1: H.bgDeep, bg2: H.bg, bg3: H.bgDeep, ink: H.ink, dim: 'rgba(247,236,216,0.72)',
        faint: H.inkDim, gold: H.gold, ember: H.ember, rule: 'rgba(236,180,78,0.28)', glow: H.glowRgb }
    : { dark, bg1: P.paperHi, bg2: P.paperLo, bg3: P.paperLo, ink: P.ink, dim: P.inkSoft,
        faint: P.inkFaint, gold: P.gold, ember: P.ember, rule: P.rule, glow: '193,82,31' };
}

function divider(color, center) {
  return `<div class="divider" style="${center ? 'justify-content:center;' : ''}">
    <span class="line" style="background:linear-gradient(90deg,transparent,${color})"></span>
    <span class="mark">✦</span>
    <span class="line" style="background:linear-gradient(270deg,transparent,${color})"></span>
  </div>`;
}

function wordmark(palette, lead = 'LORE', tail = 'STEAD') {
  const base = palette === 'light' ? P.ink : H.ink;
  const acc = palette === 'light' ? P.gold : H.gold;
  return `<div class="wordmark"><span style="color:${base}">${lead}</span><span style="color:${acc}">${tail}</span></div>`;
}

// ── main builder (split / stacked / showcase) ──
export function buildHtml(spec) {
  const {
    palette = 'dark', layout = 'split', lang = 'ja',
    eyebrow, headline = [], accent, subcopy, body = [], align = 'left',
    device,
  } = spec;
  const c = colors(palette);
  const headFont = lang === 'ja' ? fonts.jp : fonts.display;
  const bodyFont = lang === 'ja' ? fonts.jp : fonts.body;
  // split is the short landscape format — smaller head so authored line
  // breaks hold (no mid-word wrap) and the body clears the footer.
  const headSize = layout === 'showcase' ? 40 : layout === 'split' ? 42 : 56;
  const bodySize = layout === 'split' ? 17 : 19;

  const headlineHtml = headline.map((line) => {
    if (accent && line.includes(accent)) {
      const [a, b = ''] = line.split(accent);
      return `<span class="hline">${esc(a)}<em class="acc">${esc(accent)}</em>${esc(b)}</span>`;
    }
    return `<span class="hline">${esc(line)}</span>`;
  }).join('');

  const eyebrowHtml = eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : '';
  const subHtml = subcopy ? `<p class="sub">${esc(subcopy)}</p>` : '';
  const bodyHtml = body.length ? `<p class="body">${body.map(esc).join('<br/>')}</p>` : '';
  const deviceHtml = device ? renderFrame(device.type || 'browser', device.src, { host: device.host, palette }) : '';

  const textBlock = `<div class="text">
      ${eyebrowHtml}
      <h1 class="headline">${headlineHtml}</h1>
      ${subHtml}
      ${divider(c.rule, align === 'center')}
      ${bodyHtml}
    </div>`;

  let main;
  if (layout === 'stacked') {
    main = `<div class="col stacked">${textBlock}<div class="device device-stacked">${deviceHtml}</div></div>`;
  } else if (layout === 'showcase') {
    main = `<div class="col showcase">
      <div class="device device-showcase">${deviceHtml}</div>
      <div class="showcase-cap">${eyebrowHtml}<h1 class="headline">${headlineHtml}</h1>${subHtml}</div>
    </div>`;
  } else {
    main = `<div class="col split">${textBlock}<div class="device device-split">${deviceHtml}</div></div>`;
  }

  const styleExtra = /* css */`
    .col { position:absolute; inset:0; padding:132px 64px 96px; display:flex; }
    .col.split { align-items:center; gap:44px; padding-bottom:140px; }
    .col.split .text { flex:0 0 48%; }
    .col.split .device-split { flex:1; min-width:0; display:flex; align-items:center; justify-content:center; }
    .col.split .device-split .frame { width:100%; }
    .col.stacked { flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:52px; padding:96px 40px; }
    .col.stacked .text { max-width:88%; display:flex; flex-direction:column; align-items:center; }
    .col.stacked .device-stacked { width:96%; display:flex; justify-content:center; }
    .col.stacked .device-stacked .frame { width:100%; }
    .col.showcase { flex-direction:column; align-items:center; text-align:center; justify-content:center; gap:52px; padding:80px 40px; }
    .col.showcase .device-showcase { width:100%; display:flex; justify-content:center; }
    .col.showcase .device-showcase .frame { width:100%; max-width:100%; }
    .showcase-cap { max-width:92%; }
    .text { text-align:${align}; ${align === 'center' ? 'align-items:center;' : ''} }

    .eyebrow { font-family:${fonts.display}; font-weight:500; font-size:13px; letter-spacing:${lang === 'ja' ? '0.24em' : '0.4em'}; text-indent:${lang === 'ja' ? '0.24em' : '0.4em'}; text-transform:${lang === 'ja' ? 'none' : 'uppercase'}; color:${c.gold}; margin-bottom:22px; }
    .headline { font-family:${headFont}; font-weight:${lang === 'ja' ? 700 : 600}; font-size:${headSize}px; line-height:1.22; letter-spacing:${lang === 'ja' ? '0.04em' : '0.03em'}; color:${c.ink}; text-wrap:balance; text-shadow:${c.dark ? '0 2px 18px rgba(0,0,0,0.6)' : 'none'}; }
    .headline .hline { display:block; }
    .headline .acc { font-style:normal; color:${c.ember}; box-shadow:inset 0 -0.14em 0 rgba(${c.glow},0.4); padding:0 0.04em; }
    .sub { margin-top:20px; font-family:${bodyFont}; font-style:${lang === 'ja' ? 'normal' : 'italic'}; font-size:22px; line-height:1.5; color:${c.dim}; }
    .divider { display:flex; align-items:center; gap:14px; margin:30px 0; }
    .divider .line { height:1px; width:76px; }
    .divider .mark { color:${c.gold}; font-size:13px; letter-spacing:0.2em; }
    .body { font-family:${bodyFont}; font-size:${bodySize}px; line-height:1.65; color:${c.dim}; max-width:38em; }`;

  return page(spec, c, main, styleExtra);
}

// ── stage-growth filmstrip ──
export function buildSequenceHtml(spec) {
  const { palette = 'dark', lang = 'ja', eyebrow, headline = [], subcopy, stills = [] } = spec;
  const c = colors(palette);
  const headFont = lang === 'ja' ? fonts.jp : fonts.display;

  const cells = stills.map((s) => `
    <div class="cell">
      <div class="cell-frame"><img src="${s.src}" alt=""/></div>
      <div class="cell-label">${esc(s.label || '')}</div>
    </div>`).join('');

  const main = `<div class="col seq">
    <div class="seq-head">
      ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
      <h1 class="headline">${headline.map((l) => `<span class="hline">${esc(l)}</span>`).join('')}</h1>
      ${subcopy ? `<p class="sub">${esc(subcopy)}</p>` : ''}
    </div>
    <div class="strip">${cells}</div>
  </div>`;

  const styleExtra = /* css */`
    .col { position:absolute; inset:0; }
    .col.seq { flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:60px; padding:96px 56px; display:flex; }
    .seq-head { max-width:88%; }
    .eyebrow { font-family:${fonts.display}; font-weight:500; font-size:13px; letter-spacing:${lang === 'ja' ? '0.24em' : '0.4em'}; text-indent:${lang === 'ja' ? '0.24em' : '0.4em'}; text-transform:${lang === 'ja' ? 'none' : 'uppercase'}; color:${c.gold}; margin-bottom:20px; }
    .headline { font-family:${headFont}; font-weight:${lang === 'ja' ? 700 : 600}; font-size:46px; line-height:1.22; letter-spacing:${lang === 'ja' ? '0.04em' : '0.03em'}; color:${c.ink}; text-wrap:balance; text-shadow:${c.dark ? '0 2px 18px rgba(0,0,0,0.6)' : 'none'}; }
    .headline .hline { display:block; }
    .sub { margin-top:18px; font-family:${lang === 'ja' ? fonts.jp : fonts.body}; font-style:${lang === 'ja' ? 'normal' : 'italic'}; font-size:21px; color:${c.dim}; }
    /* 3-over-2 grid: cells ~1.6× the old single-row size, last row centered */
    .strip { display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:center; gap:34px 28px; width:100%; }
    .cell { display:flex; flex-direction:column; align-items:center; gap:16px; flex:0 0 calc((100% - 56px)/3); min-width:0; }
    .cell-frame { width:100%; aspect-ratio:1; border-radius:14px; overflow:hidden; background:#15100b; border:1px solid rgba(236,180,78,0.24); box-shadow:0 26px 52px rgba(0,0,0,0.5); }
    .cell-frame img { width:100%; height:100%; object-fit:cover; display:block; }
    .cell-label { font-family:${fonts.display}; font-size:17px; letter-spacing:0.18em; color:${c.gold}; text-transform:uppercase; }`;

  return page(spec, c, main, styleExtra);
}

// ── shared page shell: backdrop, brand, footer, frame CSS ──
function page(spec, c, main, styleExtra = '') {
  const { width, height, palette = 'dark', layout = 'split', lang = 'ja', footer = {} } = spec;
  const centerFoot = layout === 'stacked' || layout === 'showcase' || layout === 'seq' || layout === 'sequence';

  const footerHtml = (footer.tag || footer.cta) ? `
    <div class="footer" style="${centerFoot ? 'justify-content:center;' : ''}">
      ${footer.tag ? `<span class="ftag">${esc(footer.tag)}</span>` : ''}
      ${footer.tag && footer.cta ? `<span class="fsep">·</span>` : ''}
      ${footer.cta ? `<span class="fcta">${esc(footer.cta)}</span>` : ''}
    </div>` : '';

  return /* html */`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${FONT_LINK}" rel="stylesheet"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${width}px; height:${height}px; }
  .stage { position:relative; width:${width}px; height:${height}px; overflow:hidden; color:${c.ink}; font-family:${fonts.body};
    background: radial-gradient(120% 110% at 50% -12%, ${c.bg1} 0%, ${c.bg2} 62%, ${c.bg3} 100%); }
  .stage::before { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background: radial-gradient(58% 46% at 50% ${c.dark ? '104%' : '108%'}, rgba(${c.glow},${c.dark ? 0.22 : 0.14}), transparent 62%); }
  .stage::after { content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background-image:${NOISE_SVG}; opacity:0.5; mix-blend-mode:${c.dark ? 'screen' : 'multiply'};
    box-shadow: inset 0 0 220px rgba(0,0,0,${c.dark ? 0.55 : 0}), inset 0 0 60px rgba(0,0,0,${c.dark ? 0.3 : 0}); }
  .stage > * { position:relative; z-index:1; }

  ${FRAME_CSS}

  .brand { position:absolute; top:56px; left:64px; z-index:3; display:flex; align-items:center; gap:12px; }
  .flame { width:12px; height:16px; border-radius:50% 50% 48% 48%/64% 64% 38% 38%;
    background:radial-gradient(circle at 50% 68%, #fff3d6 0%, ${H.emberHi} 36%, ${H.emberLo} 68%, transparent 82%);
    box-shadow:0 0 18px 4px rgba(${H.glowRgb},0.5); }
  .wordmark { font-family:${fonts.display}; font-weight:600; font-size:24px; letter-spacing:0.24em; text-indent:0.24em; }

  .footer { position:absolute; left:64px; right:64px; bottom:52px; z-index:3; display:flex; align-items:center; gap:16px;
    padding-top:24px; border-top:1px solid ${c.rule}; }
  .ftag { font-family:${fonts.display}; font-weight:500; font-size:13px; letter-spacing:0.28em; text-indent:0.28em; text-transform:uppercase; color:${c.gold}; }
  .fsep { color:${c.faint}; }
  .fcta { font-family:${lang === 'ja' ? fonts.jp : fonts.display}; font-size:15px; letter-spacing:${lang === 'ja' ? '0.04em' : '0.14em'}; text-transform:${lang === 'ja' ? 'none' : 'uppercase'}; color:${c.ink}; }

  ${styleExtra}
</style></head>
<body>
  <div class="stage">
    <div class="brand"><span class="flame"></span>${wordmark(palette)}</div>
    ${main}
    ${footerHtml}
  </div>
</body></html>`;
}
