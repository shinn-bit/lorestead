// ════════════════════════════════════════════════════════════════
//  Device frames — wrap a real screenshot in a PC / iPad mock.
//  The app's real usage is "PC work + a tablet running the sub-screen",
//  so promos use PC (browser window / laptop) and iPad frames — never a
//  phone. Screenshots are widescreen browser captures (~2:1), which fit
//  the browser + laptop frames natively; the iPad frame is landscape.
//
//  Every frame is pure HTML/CSS (no images beyond the screenshot itself)
//  so it scales crisply at any export resolution.
// ════════════════════════════════════════════════════════════════

export const FRAME_CSS = /* css */ `
  .frame { position: relative; filter: drop-shadow(0 40px 80px rgba(0,0,0,0.55)) drop-shadow(0 8px 24px rgba(0,0,0,0.4)); }
  .frame img { display: block; width: 100%; height: 100%; object-fit: cover; }

  /* ── Browser window (default "PC") ── */
  .frame-browser { border-radius: 14px; overflow: hidden; background: #1b1613;
    border: 1px solid rgba(236,180,78,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
  .frame-browser .chrome {
    height: 44px; display: flex; align-items: center; gap: 14px; padding: 0 18px;
    background: linear-gradient(180deg,#241d17,#191410);
    border-bottom: 1px solid rgba(236,180,78,0.12);
  }
  .frame-browser .dots { display: flex; gap: 8px; }
  .frame-browser .dots i { width: 12px; height: 12px; border-radius: 50%; display: block; }
  .frame-browser .dots i:nth-child(1){ background:#e0685f; }
  .frame-browser .dots i:nth-child(2){ background:#e3b34d; }
  .frame-browser .dots i:nth-child(3){ background:#63c363; }
  .frame-browser .addr {
    flex: 1; height: 26px; max-width: 340px; margin: 0 auto; border-radius: 9999px;
    background: rgba(0,0,0,0.28); border: 1px solid rgba(236,180,78,0.14);
    display: flex; align-items: center; justify-content: center; gap: 7px;
    font-family: 'EB Garamond', serif; font-size: 13px; letter-spacing: 0.02em; color: rgba(247,236,216,0.62);
  }
  .frame-browser .addr svg { width: 11px; height: 11px; opacity: 0.7; }
  .frame-browser .screen { display: block; background: #15100b; }

  /* light (parchment) chrome — for promos on the cream palette */
  .frame-browser.light { background:#e2d3ad; border:1px solid rgba(58,42,23,0.22); }
  .frame-browser.light .chrome { background:linear-gradient(180deg,#ddcda3,#d3c091); border-bottom:1px solid rgba(58,42,23,0.2); }
  .frame-browser.light .dots i:nth-child(1){ background:#c76b56; }
  .frame-browser.light .dots i:nth-child(2){ background:#cba24a; }
  .frame-browser.light .dots i:nth-child(3){ background:#7ba05b; }
  .frame-browser.light .addr { background:rgba(255,252,242,0.5); border:1px solid rgba(58,42,23,0.2); color:#6e5836; }
  .frame-browser.light .addr svg { stroke:rgba(110,88,54,0.7); }

  /* ── Laptop (MacBook-ish) ── */
  .frame-laptop { display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 46px 90px rgba(0,0,0,0.6)); }
  .frame-laptop .lid {
    width: 100%; padding: 12px; border-radius: 20px; background: linear-gradient(160deg,#2a231c,#14100b);
    border: 1px solid rgba(236,180,78,0.14); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .frame-laptop .cam { width: 5px; height: 5px; border-radius: 50%; background: rgba(236,180,78,0.3); margin: 0 auto 7px; }
  .frame-laptop .screen { border-radius: 6px; overflow: hidden; background: #15100b; border: 1px solid rgba(0,0,0,0.5); }
  .frame-laptop .base {
    width: 116%; height: 16px; margin-top: -1px; border-radius: 0 0 12px 12px;
    background: linear-gradient(180deg,#2a231c,#1a1510); position: relative;
    box-shadow: 0 10px 22px rgba(0,0,0,0.5);
  }
  .frame-laptop .base::after {
    content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 92px; height: 7px; border-radius: 0 0 7px 7px; background: rgba(0,0,0,0.34);
  }

  /* ── iPad (landscape) ── */
  .frame-ipad {
    padding: 20px; border-radius: 30px; background: linear-gradient(150deg,#2c261f,#14110c);
    border: 1px solid rgba(236,180,78,0.16);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 2px rgba(0,0,0,0.35);
  }
  .frame-ipad .screen { border-radius: 8px; overflow: hidden; background: #15100b; }
  .frame-ipad .cam { position: absolute; top: 50%; left: 9px; transform: translateY(-50%);
    width: 6px; height: 6px; border-radius: 50%; background: rgba(236,180,78,0.28); }
`;

const globe = `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(247,236,216,0.55)" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>`;

/**
 * @param {'browser'|'laptop'|'ipad'} type
 * @param {string} src   data URI (or file path) of the screenshot
 * @param {object} opts  { host: address-bar text }
 */
export function renderFrame(type, src, opts = {}) {
  const host = opts.host ?? 'lorestead.app';
  const light = opts.palette === 'light' ? ' light' : '';
  const img = `<img src="${src}" alt="Lorestead app screenshot" />`;

  if (type === 'laptop') {
    return `<div class="frame frame-laptop">
      <div class="lid"><div class="cam"></div><div class="screen">${img}</div></div>
      <div class="base"></div>
    </div>`;
  }
  if (type === 'ipad') {
    return `<div class="frame frame-ipad" style="position:relative">
      <div class="cam"></div><div class="screen">${img}</div>
    </div>`;
  }
  // browser (default)
  return `<div class="frame frame-browser${light}">
    <div class="chrome">
      <div class="dots"><i></i><i></i><i></i></div>
      <div class="addr">${globe}${host}</div>
    </div>
    <div class="screen">${img}</div>
  </div>`;
}
