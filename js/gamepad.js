// Gamepad API menu navigation (standard mapping: PS / Xbox / Backbone).
// D-pad or left stick moves focus, A/Cross activates, B/Circle goes back,
// LB/RB (L1/R1) switch tabs. In-game controls come with Survival (Phase 3).
const TABS = ['home', 'drawing', 'survival', 'create', 'vault'];
let raf = 0, prev = [], lastMove = 0;

function candidates() {
  const sheet = document.querySelector('#sheet-root .sheet');
  const roots = sheet ? [sheet] : [document.querySelector('.screen.active'), document.getElementById('tabbar')];
  const out = [];
  roots.filter(Boolean).forEach((r) => r.querySelectorAll('button:not([disabled]), [data-act], input, select, a[href]').forEach((el) => {
    if (el.closest('[hidden]')) return;
    const b = el.getBoundingClientRect();
    if (b.width > 4 && b.height > 4 && b.bottom > 0 && b.top < innerHeight && getComputedStyle(el).visibility !== 'hidden') out.push(el);
  }));
  return out;
}
function focusEl(el) {
  document.querySelectorAll('.pad-focus').forEach((e) => e.classList.remove('pad-focus'));
  el.classList.add('pad-focus'); el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
export function move(dir) {
  const list = candidates(); if (!list.length) return;
  const cur = document.querySelector('.pad-focus');
  if (!cur || !list.includes(cur)) { focusEl(list[0]); return; }
  const a = cur.getBoundingClientRect(); const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, bestD = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect(); const dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
    const ok = dir === 'up' ? dy < -4 : dir === 'down' ? dy > 4 : dir === 'left' ? dx < -4 : dx > 4;
    if (!ok) continue;
    const main = dir === 'up' || dir === 'down' ? Math.abs(dy) : Math.abs(dx), cross = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
    const d = main + cross * 2.5;
    if (d < bestD) { bestD = d; best = el; }
  }
  if (best) focusEl(best);
}
function press(i) {
  const cur = document.querySelector('.pad-focus');
  if (i === 0 && cur) cur.click();
  if (i === 1) (document.querySelector('#sheet-root .sheet [data-act="sheet-close"]') || document.querySelector('.screen.active [data-act="back"]'))?.click();
  if (i === 4 || i === 5) {
    const now = document.body.dataset.screen; const k = TABS.indexOf(now);
    const next = TABS[(Math.max(0, k) + (i === 5 ? 1 : TABS.length - 1)) % TABS.length];
    document.querySelector(`#tabbar [data-tab="${next}"]`)?.click();
  }
}
function poll() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  if (!pads.length) { raf = 0; document.body.classList.remove('pad-on'); return; }
  const g = pads[0]; const b = g.buttons.map((x) => !!(x && (x.pressed || x.value > 0.5)));
  [0, 1, 4, 5].forEach((i) => { if (b[i] && !prev[i]) press(i); });
  const ax = g.axes[0] || 0, ay = g.axes[1] || 0, now = performance.now();
  const dir = b[12] || ay < -0.6 ? 'up' : b[13] || ay > 0.6 ? 'down' : b[14] || ax < -0.6 ? 'left' : b[15] || ax > 0.6 ? 'right' : null;
  const fresh = [12, 13, 14, 15].some((i) => b[i] && !prev[i]);
  if (dir && (fresh || now - lastMove > 220)) { move(dir); lastMove = now; }
  prev = b;
  raf = requestAnimationFrame(poll);
}
export function startGamepadNav() {
  window.addEventListener('gamepadconnected', () => { document.body.classList.add('pad-on'); if (!raf) raf = requestAnimationFrame(poll); });
  if (navigator.getGamepads && [...navigator.getGamepads()].some(Boolean) && !raf) raf = requestAnimationFrame(poll);
}
