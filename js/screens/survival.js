// SURVIVAL — mode select (portrait, design sheet screen 2) + landscape preview.
// Phase 2 ships the mode list with an HONEST status per mode. No mode is
// playable yet: the first playable round (Phase 3) is the night-time ruined-city
// survival round; the other modes follow one at a time (Phase 7).
import { Store } from '../store.js';
import { esc, ICONS, onAction } from '../ui.js';
import { play } from '../audio.js';
import { sectionHeader, phasePanel } from './common.js';

const g = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const MODES = [
  { id: 'hide-seek', name: 'HIDE & SEEK', tag: 'No weapons. Use your wits.', icon: g('<circle cx="12" cy="10" r="5"/><path d="M8.5 13.5 5 20M15.5 13.5 19 20"/><circle cx="10.3" cy="9.5" r=".8"/><circle cx="13.7" cy="9.5" r=".8"/>'),
    status: 'planned', phase: 7, rules: 'Hide from the infected without weapons. Stay hidden until the timer ends to win; get found and you lose.' },
  { id: 'story', name: 'STORY MODE', tag: 'Cinematic story experience.', icon: g('<path d="M4 18 6 7l4 4 2-6 2 6 4-4 2 11Z"/><path d="M4 21h16"/>'),
    status: 'planned', phase: 7, rules: 'Chapter-based missions through the ruined city with ORB as your guide.' },
  { id: 'multiplayer', name: 'MULTIPLAYER', tag: 'Real-time PvP battles.', icon: g('<path d="M5 4l14 16M19 4 5 20"/><path d="M4 7l3-3M17 20l3-3M20 7l-3-3M7 20l-3-3"/>'),
    status: 'server', phase: 7, rules: 'Online matches need a game server. Nothing here pretends to be online; a local prototype will be labeled as local.' },
  { id: 'infection', name: 'ZOMBIE INFECTION', tag: 'Survive… or become one.', icon: g('<circle cx="12" cy="8" r="4"/><path d="M7 21v-4a5 5 0 0 1 10 0v4"/><path d="M3 10l2 2M21 10l-2 2M9 7.5h.01M15 7.5h.01"/>'),
    status: 'next', phase: 3, rules: 'First playable round (Phase 3): ruined city at night, a survivor with a pistol, zombies that spawn, chase and attack. Survive 60 seconds or reach extraction.' },
  { id: 'escape', name: 'ESCAPE THE BUILDING', tag: "Find the exit. Don't die trying.", icon: g('<circle cx="14" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v5M11 15l1-6 4 3 3 1M12 9l-4 1-2 3"/>'),
    status: 'planned', phase: 7, rules: 'Fight floor by floor through a collapsing building to the exit.' },
  { id: 'royale', name: 'BATTLE ROYALE', tag: 'Last survivor stands.', icon: g('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    status: 'planned', phase: 7, rules: 'Shrinking zone, scavenged loadouts, last one standing. Will be labeled planned until a working prototype exists.' },
];
const STATUS = { planned: (m) => `Planned · Phase ${m.phase}`, server: () => 'Needs online server · planned', next: () => 'Next up · first playable in Phase 3' };

export const survivalState = { fullscreen: false, locked: false, lockError: '', stage: 'select', mode: null };
export function selectedMode() { return MODES.find((m) => m.id === survivalState.mode) || null; }
export function inArena() { return survivalState.stage === 'preview'; }
export function resetSurvival() { survivalState.stage = 'select'; document.body.removeAttribute('data-arena'); }

/** Must be called from a user gesture. Requests fullscreen + landscape lock. */
export async function enterSurvival() {
  survivalState.fullscreen = false; survivalState.locked = false; survivalState.lockError = '';
  survivalState.stage = 'preview'; document.body.dataset.arena = '1';
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
  resetSurvival();
}

function renderSelect() {
  const sel = survivalState.mode; const m = selectedMode();
  const rec = Store.profile.stats;
  return `${sectionHeader('SURVIVAL', 'Choose your mode')}
  <div class="surv-banner" aria-hidden="true"></div>
  <h3 class="label">Choose your mode</h3>
  <div class="modes-list" role="radiogroup" aria-label="Survival modes">${MODES.map((x) => `
    <button class="mode-row glass ${sel === x.id ? 'on' : ''}" role="radio" aria-checked="${sel === x.id}" data-act="mode-pick" data-id="${x.id}">
      <span class="mode-ic">${x.icon}</span>
      <span class="grow"><b>${x.name}</b><small>${esc(x.tag)}</small></span>
      <span class="mode-st st-${x.status}">${STATUS[x.status](x)}</span></button>`).join('')}</div>
  ${m ? `<div class="card glass mode-info"><h3>${m.name}</h3><p class="muted small">${esc(m.rules)}</p>
    <p class="small"><b class="t-pink">Status:</b> ${STATUS[m.status](m)}. Not playable in this build — CONFIRM opens the landscape preview only.</p></div>` : '<p class="muted small center">Select a mode to see its status.</p>'}
  <button class="play-btn confirm-btn" data-act="mode-confirm" ${m ? '' : 'disabled'}><b>CONFIRM</b></button>
  <div class="card glass"><div class="card-head"><h3>Survival records</h3></div>
    <p class="muted small">${rec.missions || rec.kills ? `Missions: ${rec.missions} · Enemies defeated: ${rec.kills}` : 'No records yet. Records start with the first playable round (Phase 3).'}</p></div>`;
}

function renderPreview() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const m = selectedMode() || MODES[3];
  return `
  <div class="surv">
    <div class="surv-top">
      <div class="hud-chip"><span class="dot"></span> ${esc(m.name)} · PREVIEW</div>
      <button class="btn sm ghost" data-act="exit-survival">${ICONS.exit} Exit</button>
    </div>
    <div class="surv-mid">
      <div class="surv-title"><span class="eyebrow">SURVIVAL</span><h1 class="h1">THE CITY IS STILL BURNING</h1></div>
      ${m.status === 'next'
        ? phasePanel(3, 'Playable survival in development', 'You are in landscape mode — the switch works. Phase 3 brings the first playable round: a ruined city at night, a survivor with a pistol, twin-thumb move/aim/shoot/reload, zombies that spawn, chase and attack, and a 60-second survive-or-extract win/lose with results.')
        : phasePanel(m.phase, `${m.name.toLowerCase()} is not built yet`, `${m.rules} ${STATUS[m.status](m)}. Landscape mode works; there is no gameplay behind this screen yet.`)}
    </div>
    <div class="surv-bottom">
      <div class="hud-chip">Fullscreen: ${survivalState.fullscreen ? 'on' : 'not available'}</div>
      <div class="hud-chip">Orientation: ${survivalState.locked ? 'locked to landscape' : esc(survivalState.lockError || 'manual')}</div>
      <div class="hud-chip">Controller: ${pads.length ? esc(pads[0].id.slice(0, 28)) : 'none detected'}</div>
    </div>
  </div>`;
}

export function render() { return inArena() ? renderPreview() : renderSelect(); }

onAction('mode-pick', (el) => { survivalState.mode = el.dataset.id; play('toggle'); document.dispatchEvent(new Event('rerender')); document.dispatchEvent(new Event('activity')); });
onAction('mode-confirm', () => { if (!selectedMode()) return; play('nav'); enterSurvival(); document.dispatchEvent(new Event('activity')); });
