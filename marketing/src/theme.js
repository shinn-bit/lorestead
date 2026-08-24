// ════════════════════════════════════════════════════════════════
//  Design tokens — mirrored from frontend/src/styles/theme.css
//  Two coordinated palettes:
//    • hearthlight (warm ember, dark)  → World/Home  → used for dark promos
//    • parchment  (manuscript, cream)  → Setup/Chronicle → used for light promos
//  Keep these in sync with theme.css if the app palette changes.
// ════════════════════════════════════════════════════════════════

export const hearthlight = {
  bg:        '#15100b',
  bgDeep:    '#0d0906',
  ink:       '#f7ecd8',
  inkDim:    'rgba(247,236,216,0.5)',
  inkFaint:  'rgba(247,236,216,0.34)',
  ember:     '#f0a44a',
  emberHi:   '#f3b659',
  emberLo:   '#e08327',
  gold:      '#ecb44e',
  goldRgb:   '236,180,78',
  glowRgb:   '240,140,55',
  panel:     'rgba(20,13,8,0.5)',
};

export const parchment = {
  paperHi:   '#efe6cf',
  paper:     '#e6d8b8',
  paperLo:   '#d8c69e',
  ink:       '#3a2a17',
  inkSoft:   '#6e5836',
  inkFaint:  '#8c7551',
  ember:     '#c1521f',
  emberDeep: '#9c3d14',
  gold:      '#a37e2c',
  rule:      'rgba(58,42,23,0.28)',
};

export const fonts = {
  display: "'Cinzel', serif",              // headings, wordmark, key UI
  body:    "'EB Garamond', serif",         // running / italic copy
  jp:      "'Shippori Mincho', serif",     // Japanese serif
};

// Google Fonts stylesheet used by every template (Puppeteer has network access).
export const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@300;400;500;600;700;900' +
  '&family=EB+Garamond:ital,wght@0,400;0,500;1,400' +
  '&family=Shippori+Mincho:wght@400;500;600;700;800&display=swap';

// Shared paper-grain noise (data URI, from theme.css .parchment::before).
export const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")";
