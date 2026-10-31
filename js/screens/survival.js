import { esc, ICONS } from '../ui.js';
import { phasePanel } from './common.js';

export const survivalState = { fullscreen: false, locked: false, lockError: '' };

/** Must be called from a user gesture. Requests fullscreen + landscape lock. */
export async function enterSurvival() {
  survivalState.fullscreen = false; survivalState.locked = false; survivalState.lockError = '';
  const el = document.documentElement;
  try {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req && !document.fullscreenElement) { await req.call(el, { navigationUI: 'hide' }); }
    survivalState.fullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
  } catch (e) { survivalState.lockError = 'Fullscreen not available'; }
  try {
    if (screen.orientation?.lock) { await screen.orientation.lock('landscape'); survivalState.locked = true; }
    else survivalState.lockError = 'Orientation lock not supported on this device';
  } catch (e) { survivalState.lockError = 'Orientation lock not supported here — rotate your phone'; }
  document.dispatchEvent(new Event('rerender'));
}
export async function exitSurvival() {
  try { screen.orientation?.unlock?.(); } catch {}
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
  } catch {}
  survivalState.fullscreen = false; survivalState.locked = false;
}

export function render() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  return `
  <div class="surv">
    <div class="surv-top">
      <div class="hud-chip"><span class="dot"></span> RUINED CITY · OFFLINE PREVIEW</div>
      <button class="btn sm ghost" data-act="exit-survival">${ICONS.exit} Exit</button>
    </div>
    <div class="surv-mid">
      <div class="surv-title"><span class="eyebrow">SURVIVAL</span><h1 class="h1">THE CITY IS STILL BURNING</h1></div>
      ${phasePanel(3, '3D third-person shooter in development', 'You are in landscape mode — the switch works. The 3D player, over-the-shoulder camera, movement, weapons and enemy AI arrive in Phase 3; the ruined city, missions and extraction in Phase 4.')}
    </div>
    <div class="surv-bottom">
      <div class="hud-chip">Fullscreen: ${survivalState.fullscreen ? 'on' : 'not available'}</div>
      <div class="hud-chip">Orientation: ${survivalState.locked ? 'locked to landscape' : esc(survivalState.lockError || 'manual')}</div>
      <div class="hud-chip">Controller: ${pads.length ? esc(pads[0].id.slice(0, 28)) : 'none detected'}</div>
    </div>
  </div>`;
}
