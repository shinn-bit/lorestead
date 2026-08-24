// ════════════════════════════════════════════════════════════════
//  Image specs — every promo / App Store image is one entry here.
//  Copy, sizes, framing and screenshots all live in this one file, so
//  iterating on wording or swapping a screenshot never touches the
//  rendering engine (src/*).
//
//  Sizing model: each spec has a *logical* width/height (the design
//  space the CSS in src/template.js is calibrated for, ~1024–1200 wide)
//  and a `scale`. Puppeteer renders at logical size × scale, so:
//     • SNS       1200×675 / 1200×1200  @scale 2 → 2400px (retina-sharp)
//     • App Store 1024×1366             @scale 2 → 2048×2732 (12.9" iPad Pro, exact)
//
//  Copy note: headline / CTA / tag strings marked ⟪provided⟫ come from
//  the brief verbatim. Body/description lines are drafts — edit freely.
// ════════════════════════════════════════════════════════════════

// Screenshots are referenced by name only and resolved at render time
// (render.mjs skips any spec whose screenshot isn't in frontend/screenshot/
// yet) — so you can drop files in as they're captured and re-render.
//   device: { screenshot: '03_home.png' }        → frontend/screenshot/03_home.png
//   stills: [{ world: 'town', stage: 1 }]        → .../worlds/town/stills/stage_01.png

const TAG = 'FOCUS · GROWTH';                    // ⟪provided⟫ category tag
// App Store 未リリースのため CTA は現在オフ。リリース後に footer へ `cta: CTA` を戻す。
// const CTA = 'App Storeで「Lorestead」を検索';

export const IMAGES = [
  // ── 1. SNS hero — landscape (X/OG card) ──
  {
    id: 'hero-landscape',
    kind: 'standard',
    width: 1200, height: 675, scale: 2,
    palette: 'light', layout: 'split', lang: 'ja', align: 'left',
    eyebrow: '集中が、世界になる',
    headline: ['目標から逆算して、', '集中した分だけ世界が育つ。'],   // ⟪provided⟫
    subcopy: 'Study With Me の、その先へ。',                        // ⟪provided⟫
    body: [
      'タイマーを始めると、中世プラハの街が動き出す。',
      'あなたが集中した時間が、そのまま世界の成長になる。',
    ],
    device: { type: 'browser', screenshot: '03_home.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },

  // ── 2. SNS hero — square (Instagram / general) ──
  {
    id: 'hero-square',
    kind: 'standard',
    width: 1200, height: 1200, scale: 2,
    palette: 'light', layout: 'stacked', lang: 'ja', align: 'center',
    eyebrow: '集中が、世界になる',
    headline: ['目標から逆算して、', '集中した分だけ世界が育つ。'],   // ⟪provided⟫
    subcopy: 'Study With Me の、その先へ。',                        // ⟪provided⟫
    device: { type: 'browser', screenshot: '03_home.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },

  // ── App Store set (12.9" iPad Pro portrait, 2048×2732) ──

  // 3. World screen — the living medieval town
  {
    id: 'appstore-1-world',
    kind: 'standard',
    width: 1024, height: 1366, scale: 2,
    palette: 'light', layout: 'stacked', lang: 'ja', align: 'center',
    eyebrow: 'THE LIVING WORLD',
    headline: ['集中した時間が、', '世界を育てていく。'],
    subcopy: '中世プラハの街が、あなたの手で少しずつ完成へ向かう。',
    device: { type: 'browser', screenshot: '03_home.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },

  // 4. Home — marginalia design, ledger tasks
  {
    id: 'appstore-2-home',
    kind: 'standard',
    width: 1024, height: 1366, scale: 2,
    palette: 'light', layout: 'stacked', lang: 'ja', align: 'center',
    eyebrow: 'THE LEDGER',
    headline: ['タスクをこなすたび、', '街が一つ進む。'],
    subcopy: '塗りも枠もない。文字と金の罫線だけで、静かに進む。',
    // 新 03_home は日本語のタスク台帳（2/5・育った街）を写しており、
    // このコピーにそのまま合う。専用の tasks 撮り直しは不要。
    device: { type: 'browser', screenshot: '03_home.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },

  // 5. Stage-growth sequence — empty land → complete
  {
    id: 'appstore-3-growth',
    kind: 'sequence',
    width: 1024, height: 1366, scale: 2,
    palette: 'light', lang: 'ja',
    eyebrow: 'FIVE BUILD PHASES',
    headline: ['更地から、完成まで。'],
    subcopy: '積み上げた時間が、そのまま街の姿になる。',
    stills: [
      { world: 'town', stage: 1, label: '01' },
      { world: 'town', stage: 2, label: '02' },
      { world: 'town', stage: 3, label: '03' },
      { world: 'town', stage: 4, label: '04' },
      { world: 'town', stage: 5, label: '05 · 完成' },
    ],
    footer: { tag: TAG },
  },

  // 6. Audience appeal — text-forward, world backdrop
  {
    id: 'appstore-5-audience',
    kind: 'standard',
    width: 1024, height: 1366, scale: 2,
    palette: 'light', layout: 'showcase', lang: 'ja',
    eyebrow: 'FOR THE LONG HAUL',
    headline: ['資格試験も、卒論も。', '1人でコツコツ向き合う人へ。'],
    subcopy: '積み上げた集中が、目に見える街として残る。',
    device: { type: 'ipad', screenshot: '03_home.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },

  // ── Waiting on screenshots (auto-skipped until the PNG exists) ──
  // Drop the capture into frontend/screenshot/ with the name below, then
  // `npm run render`. Tune copy freely.

  // 8. Progress calendar (Chronicle) — parchment palette to match the screen
  {
    id: 'appstore-6-chronicle',
    kind: 'standard',
    width: 1024, height: 1366, scale: 2,
    palette: 'light', layout: 'stacked', lang: 'ja', align: 'center',
    eyebrow: 'THE CHRONICLE',
    headline: ['続けた日々が、', '一枚の記録になる。'],
    subcopy: '集中した日は、その日の街の姿でカレンダーに残る。',
    device: { type: 'browser', screenshot: '05_chronicle.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },

  // 9. World event — a special moment in the living town (event video still)
  {
    id: 'appstore-7-event',
    kind: 'standard',
    width: 1024, height: 1366, scale: 2,
    palette: 'light', layout: 'showcase', lang: 'ja',
    eyebrow: 'MOMENTS IN THE WORLD',
    headline: ['ときどき、', '街に物語が起きる。'],
    subcopy: '同じ景色は二度とない。集中の合間に訪れる小さな出来事。',
    device: { type: 'browser', screenshot: '06_event.png', host: 'lorestead.app' },
    footer: { tag: TAG },
  },
];

// Grown-stage / event-video home shots: capture and overwrite 03_home.png
// (or add a new name + spec). 03_home.png is currently the stage-1 (empty
// land) capture and stands in as a placeholder for the hero + world shots.
