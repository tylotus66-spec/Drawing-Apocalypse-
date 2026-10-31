import { Store } from '../store.js';
import { unlocks, achievementProgress, recordElementView } from '../progression.js';
import { ACHIEVEMENTS, LEVEL_UNLOCKS, START_UNLOCKS } from '../config.js';
import { ELEMENTS, SPECIES, LORE } from '../content.js';
import { esc, ICONS, onAction, openSheet, bar } from '../ui.js';
import { play } from '../audio.js';
import { say } from '../voice.js';
import { sectionHeader, phasePanel } from './common.js';

const TABS = [['elements', 'Elements'], ['achievements', 'Achievements'], ['characters', 'Characters'], ['drawing', 'Drawing'], ['weapons', 'Weapons'], ['collectibles', 'Collectibles']];
let tab = 'elements';
export function setVaultTab(t) { if (TABS.some(([id]) => id === t)) tab = t; }

function unlockLevelFor(kind, id) {
  if (START_UNLOCKS[kind].includes(id)) return 1;
  for (const [lv, u] of Object.entries(LEVEL_UNLOCKS)) if ((u[kind] || []).includes(id)) return +lv;
  return null;
}

function elementsTab() {
  const U = unlocks();
  return `<p class="muted small">${U.elements.length} of 30 elements unlocked. Abilities become playable in Phase 5.</p>
  <div class="el-grid">${ELEMENTS.map((e, i) => {
    const on = U.elements.includes(e.id);
    return `<button class="el ${on ? 'on' : ''}" style="--ec:${e.color}" data-act="el-open" data-id="${e.id}" aria-label="${e.name}${on ? '' : ' (locked)'}">
      <span class="el-n">${String(i + 1).padStart(2, '0')}</span><span class="el-dot"></span><b>${e.name}</b>${on ? '' : `<span class="el-lock">${ICONS.lock}</span>`}</button>`;
  }).join('')}</div>`;
}

function achievementsTab() {
  const p = Store.profile;
  const groups = {};
  ACHIEVEMENTS.forEach((a) => { (groups[a.cat] ||= []).push(a); });
  return Object.entries(groups).map(([cat, list]) => `<h3 class="label">${esc(cat)}</h3>${list.map((a) => {
    const s = achievementProgress(a, p);
    return `<div class="ach glass ${s.unlocked ? 'done' : ''} ${s.available ? '' : 'dim'}">
      <span class="ach-ic">${s.unlocked ? ICONS.star : ICONS.lock}</span>
      <div class="grow"><b>${esc(a.title)}</b><div class="muted small">${esc(a.desc)}</div>
      ${s.available ? `<div class="ch-prog">${bar(s.value / s.goal, 'thin')}<span>${s.value}/${s.goal}</span></div>` : `<div class="small muted">Available in Phase ${a.phase}</div>`}</div>
      <span class="tag ${s.unlocked ? 'ok' : ''}">${s.unlocked ? new Date(p.achievements[a.id]).toLocaleDateString() : `+${a.xp} XP`}</span></div>`;
  }).join('')}`).join('');
}

function charactersTab() {
  const U = unlocks();
  return `<h3 class="label">Species</h3>${SPECIES.map((s) => {
    const on = U.species.includes(s.id); const lv = unlockLevelFor('species', s.id);
    return `<div class="locked-item glass ${on ? 'on' : ''}">${on ? ICONS.check : ICONS.lock}<div class="grow"><b>${s.name}</b><div class="muted small">${s.desc}</div></div><span class="tag ${on ? 'ok' : ''}">${on ? 'Unlocked' : lv ? `Level ${lv}` : 'Later'}</span></div>`;
  }).join('')}
  <h3 class="label">Created avatars</h3><div class="empty glass">No avatars created yet. The creator unlocks at level 5 and is built in Phase 6.</div>
  <h3 class="label">Titles</h3><div class="chips">${U.titles.map((t) => `<button class="chip ${Store.profile.title === t ? 'on' : ''}" data-act="set-title" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
}

function drawingTab() {
  const p = Store.profile;
  return `<dl class="kv glass card"><dt>Completed tutorials</dt><dd>${p.stats.tutorialsCompleted}</dd><dt>Saved tutorials</dt><dd>${p.bookmarks.length}</dd></dl>
  ${p.bookmarks.length ? `<h3 class="label">Saved</h3>${p.bookmarks.map((id) => `<button class="locked-item glass on" data-act="go" data-to="drawing" data-tut="${esc(id)}">${ICONS.bookmark}<div class="grow"><b>${esc(id.replace(/-/g, ' ').toUpperCase())}</b><div class="muted small">Open lesson</div></div></button>`).join('')}` : '<div class="empty glass">No saved tutorials yet. Save one from the DRAWING library.</div>'}
  ${phasePanel(2, 'Lesson progress & reference art', 'Step progress, playback position and finished reference artwork appear here once video lessons ship.')}`;
}

function weaponsTab() { return phasePanel(3, 'Weapon collection', 'Pistols, rifles, shotguns, SMGs, snipers, heavy and melee weapons — with stats, upgrades and customization — arrive with the Survival foundation. Nothing is unlocked yet.'); }

function collectiblesTab() {
  const p = Store.profile;
  return `<h3 class="label">Lore entries</h3>${p.lore.length ? p.lore.map((id) => `<div class="lore glass"><b>${esc(LORE[id]?.title)}</b><p class="muted">${esc(LORE[id]?.body)}</p></div>`).join('') : '<div class="empty glass">No lore discovered yet.</div>'}
  <h3 class="label">Creature records · Discoveries · Event collectibles</h3><div class="empty glass">Found in Survival and story missions (Phase 4+).</div>`;
}

export function render() {
  const body = { elements: elementsTab, achievements: achievementsTab, characters: charactersTab, drawing: drawingTab, weapons: weaponsTab, collectibles: collectiblesTab }[tab]();
  return `${sectionHeader('VAULT', 'Your collection')}
  <div class="seg" role="tablist">${TABS.map(([id, n]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'on' : ''}" data-act="vault-tab" data-id="${id}">${n}</button>`).join('')}</div>
  <div class="vault-body">${body}</div>`;
}

onAction('vault-tab', (el) => { tab = el.dataset.id; play('toggle'); document.dispatchEvent(new Event('rerender')); });
onAction('set-title', (el) => { const t = el.dataset.t; if (unlocks().titles.includes(t)) { Store.updateProfile((p) => { p.title = t; }); play('toggle'); } });
onAction('el-open', (el) => {
  const e = ELEMENTS.find((x) => x.id === el.dataset.id); if (!e) return;
  const on = unlocks().elements.includes(e.id); const lv = unlockLevelFor('elements', e.id);
  openSheet(`<div class="el-detail" style="--ec:${e.color}"><div class="el-orb"></div><div class="eyebrow">Element ${ELEMENTS.indexOf(e) + 1} of 30</div><h2 class="h2">${e.name}</h2>
    <span class="tag ${on ? 'ok' : ''}">${on ? 'Unlocked' : lv ? `Unlocks at level ${lv}` : 'Unlock path revealed in a later phase'}</span>
    <p>${esc(e.desc)}</p><h3 class="label">Abilities</h3><ul class="abil">${e.abilities.map((a) => `<li class="glass">${esc(a)}</li>`).join('')}</ul>
    <dl class="kv"><dt>Mastery</dt><dd>${on ? 'Rank 0' : '—'}</dd><dt>Upgrades</dt><dd>Phase 5</dd></dl>
    <button class="btn ghost" data-act="el-say" data-id="${e.id}">Hear ORB explain</button></div>`);
  recordElementView();
});
onAction('el-say', (el) => { const e = ELEMENTS.find((x) => x.id === el.dataset.id); if (e) say(`${e.name.toLowerCase()}. ${e.desc} Its powers include ${e.abilities.slice(0, 3).join(', ').toLowerCase()}, and ${e.abilities[3].toLowerCase()}.`); });
