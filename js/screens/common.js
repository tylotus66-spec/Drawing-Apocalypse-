import { esc, ICONS } from '../ui.js';
export function sectionHeader(title, sub, { back = false } = {}) {
  return `<header class="sec-head">
    ${back ? `<button class="icon-btn" data-act="back" aria-label="Back">${ICONS.back}</button>` : ''}
    <div class="grow"><h1 class="h1">${esc(title)}</h1>${sub ? `<div class="muted small">${esc(sub)}</div>` : ''}</div>
    <button class="orb-hit orb-mini" data-act="orb-tap" aria-label="Tap ORB for guidance"><div class="orb-slot orb-slot-sm"></div></button>
  </header>`;
}
export function phasePanel(phase, title, body) {
  return `<div class="phase-panel glass"><div class="phase-badge">PHASE ${phase}</div><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p></div>`;
}
