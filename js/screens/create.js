// CREATE (design sheet screen 6). The creator layout is shown as a real but
// inactive frame: every control is disabled and labeled, because the creator
// itself is built in Phase 6. Lists show what the player actually owns.
import { levelInfo, totalXp, isCreateUnlocked, unlocks } from '../progression.js';
import { CREATE_UNLOCK_LEVEL, totalXpForLevel } from '../config.js';
import { SPECIES, ELEMENTS } from '../content.js';
import { ICONS, bar, esc } from '../ui.js';
import { sectionHeader, phasePanel } from './common.js';

const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const TOOLS = [
  ['Appearance', sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/>')],
  ['Style', sv('<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="8.5"/>')],
  ['Element', sv('<path d="M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 2 1.3 3 2.5 3-1-3 0-6 .5-8.5Z"/>')],
  ['Abilities', sv('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>')],
  ['Preview', sv('<circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>')],
];
// Plain outline silhouette for the empty preview stage (no character art is faked).
const FIGURE = `<svg class="cr-fig" viewBox="0 0 120 240" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
  <circle cx="60" cy="30" r="17"/><path d="M60 47v8M38 62c6-5 14-7 22-7s16 2 22 7l6 52-10 4-6-40-2 50 6 96H70l-10-80-10 80H34l6-96-2-50-6 40-10-4Z"/></g></svg>`;

export function render() {
  const L = levelInfo(), xp = totalXp();
  const need = totalXpForLevel(CREATE_UNLOCK_LEVEL);
  const open = isCreateUnlocked();
  const U = unlocks();
  const species = SPECIES.map((s) => `<li class="${U.species.includes(s.id) ? 'own' : ''}">${U.species.includes(s.id) ? '' : ICONS.lock}<span>${esc(s.name)}</span></li>`).join('');
  const els = ELEMENTS.slice(0, 6).map((e) => `<li class="${U.elements.includes(e.id) ? 'own' : ''}">${U.elements.includes(e.id) ? '' : ICONS.lock}<span>${esc(e.name)}</span></li>`).join('');
  const frame = `<div class="creator ${open ? 'open' : 'sealed'}" aria-label="Creator layout preview, inactive until Phase 6">
    <aside class="cr-col cr-left">
      <div class="cr-h">SPECIES</div><ul class="cr-list">${species}</ul>
      <div class="cr-h">ELEMENT</div><ul class="cr-list">${els}<li class="more">+${ELEMENTS.length - 6} more in VAULT</li></ul>
    </aside>
    <div class="cr-stage">
      ${FIGURE}
      <div class="cr-lock">${open ? ICONS.create : ICONS.lock}<b>${open ? 'UNSEALED' : `LEVEL ${CREATE_UNLOCK_LEVEL}`}</b></div>
    </div>
    <aside class="cr-col cr-tools">${TOOLS.map(([n, ic]) => `<button class="cr-tool" disabled aria-disabled="true" title="${n}: Phase 6">${ic}<span>${n}</span></button>`).join('')}</aside>
  </div>
  <button class="btn create-btn" disabled aria-disabled="true">CREATE AVATAR <small>${open ? 'arrives in Phase 6' : `level ${CREATE_UNLOCK_LEVEL} · Phase 6`}</small></button>
  <p class="muted small center">Layout preview only. Selecting, styling and saving creations are built in Phase 6.</p>`;

  if (!open) {
    return `${sectionHeader('CREATE', 'Avatar & creature creator')}
    <div class="lock-hero glass slim">
      <h2 class="h2">SEALED UNTIL LEVEL ${CREATE_UNLOCK_LEVEL}</h2>
      <p class="muted small">The creator awakens at player level ${CREATE_UNLOCK_LEVEL}. You are level <b class="t-pink">${L.level}</b>.</p>
      ${bar(xp / need, 'xp big')}
      <div class="small">${xp} / ${need} XP to level ${CREATE_UNLOCK_LEVEL} · ${Math.max(0, need - xp)} XP to go</div>
      <div class="row gap center"><button class="btn pink sm" data-act="go" data-to="home">Earn XP on HOME</button><button class="btn ghost sm" data-act="ask">How?</button></div>
    </div>
    ${frame}
    <h3 class="label">What awakens at level ${CREATE_UNLOCK_LEVEL}</h3>
    <div class="locked-list">
      ${SPECIES.map((s) => `<div class="locked-item glass">${ICONS.lock}<div><b>${s.name}</b><div class="muted small">${s.desc}</div></div></div>`).join('')}
      <div class="locked-item glass">${ICONS.lock}<div><b>Three styles</b><div class="muted small">Normal + Element · Steampunk + Element · Cyberpunk + Element</div></div></div>
      <div class="locked-item glass">${ICONS.lock}<div><b>The 92 / 8 law</b><div class="muted small">Every creation is ~92% biological, ~8% integrated technology. No robot bodies.</div></div></div>
    </div>`;
  }
  return `${sectionHeader('CREATE', 'Avatar & creature creator')}
  <div class="lock-hero glass open slim"><h2 class="h2">THE CREATOR IS UNSEALED</h2>
  <p class="muted small">You reached level ${L.level}. Your unlock is saved to your profile.</p></div>
  ${frame}
  ${phasePanel(6, 'Full creator arrives in Phase 6', 'Species selection, biological customization, the three official styles, elemental effects, weather, and the rotating 3D preview are built in Phase 6. Your unlock carries over automatically.')}`;
}
