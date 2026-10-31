import { levelInfo, totalXp, isCreateUnlocked } from '../progression.js';
import { CREATE_UNLOCK_LEVEL, totalXpForLevel } from '../config.js';
import { SPECIES } from '../content.js';
import { ICONS, bar } from '../ui.js';
import { sectionHeader, phasePanel } from './common.js';

export function render() {
  const L = levelInfo(), xp = totalXp();
  const need = totalXpForLevel(CREATE_UNLOCK_LEVEL);
  if (!isCreateUnlocked()) {
    return `${sectionHeader('CREATE', 'Avatar & creature creator')}
    <div class="lock-hero glass">
      <div class="lock-ring">${ICONS.lock}</div>
      <h2 class="h2">SEALED UNTIL LEVEL ${CREATE_UNLOCK_LEVEL}</h2>
      <p class="muted">The creator awakens at player level ${CREATE_UNLOCK_LEVEL}. You are level <b class="t-pink">${L.level}</b>.</p>
      ${bar(xp / need, 'xp big')}
      <div class="small">${xp} / ${need} XP to level ${CREATE_UNLOCK_LEVEL} · ${Math.max(0, need - xp)} XP to go</div>
      <div class="row gap center"><button class="btn pink" data-act="go" data-to="home">Earn XP on HOME</button><button class="btn ghost" data-act="ask">How?</button></div>
    </div>
    <h3 class="label">What awakens at level ${CREATE_UNLOCK_LEVEL}</h3>
    <div class="locked-list">
      ${SPECIES.map((s) => `<div class="locked-item glass">${ICONS.lock}<div><b>${s.name}</b><div class="muted small">${s.desc}</div></div></div>`).join('')}
      <div class="locked-item glass">${ICONS.lock}<div><b>Three styles</b><div class="muted small">Normal + Element · Steampunk + Element · Cyberpunk + Element</div></div></div>
      <div class="locked-item glass">${ICONS.lock}<div><b>The 92 / 8 law</b><div class="muted small">Every creation is ~92% biological, ~8% integrated technology. No robot bodies.</div></div></div>
    </div>`;
  }
  return `${sectionHeader('CREATE', 'Avatar & creature creator')}
  <div class="lock-hero glass open"><div class="lock-ring open">${ICONS.create}</div><h2 class="h2">THE CREATOR IS UNSEALED</h2>
  <p class="muted">You reached level ${L.level}. Your unlock is saved to your profile.</p></div>
  ${phasePanel(6, 'Full creator arrives in Phase 6', 'Species selection, biological customization, the three official styles, elemental effects, weather, and the rotating 3D preview are built in Phase 6. Your unlock carries over automatically.')}`;
}
