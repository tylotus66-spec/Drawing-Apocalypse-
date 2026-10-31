import { Store } from '../store.js';
import { unlocks, achievementProgress, recordElementView, levelInfo } from '../progression.js';
import { ACHIEVEMENTS, LEVEL_UNLOCKS, START_UNLOCKS } from '../config.js';
import { ELEMENTS, SPECIES, LORE } from '../content.js';
import { esc, ICONS, onAction, openSheet, bar } from '../ui.js';
import { play } from '../audio.js';
import { say } from '../voice.js';
import { sectionHeader, phasePanel } from './common.js';
import { getLibrary } from './drawing.js';
import { LESSON_XP } from '../progression.js';

const TABS = [['characters', 'Characters'], ['elements', 'Elements'], ['weapons', 'Weapons'], ['stories', 'Stories'], ['records', 'Records'], ['achievements', 'Achievements']];
let tab = 'characters';
// The official characters (canon). Shown locked until a real unlock path exists; art = their lesson sketch.
const CANON = [['INFERNO', 'inferno-steampunk'], ['WOLF MAN', 'wolf-man-cyber-joints'], ['NIGHTMARE REX', 'nightmare-rex'], ['SHADOW PERSON', 'shadow-person'], ['WENDIGO', 'wendigo'], ['SKINWALKER', 'skinwalker'], ['ZOMBIE DRAGON', 'zombie-dragon']];
export function getVaultTab() { return tab; }
export function setVaultTab(t) { if (t === 'drawing') t = 'records'; if (t === 'collectibles') t = 'stories'; if (TABS.some(([id]) => id === t)) tab = t; }

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
  const U = unlocks(); const p = Store.profile;
  return `<div class="char-grid">${CANON.map(([n, art]) => `<div class="char-card locked"><img src="./thumbs/${art}.svg" alt="" loading="lazy"><span class="char-lock">${ICONS.lock}</span><b>${n}</b><small>Locked · unlocks in a later phase</small></div>`).join('')}</div>
  <p class="muted small">Official characters. None can be unlocked yet; their unlock path arrives with Story and Survival modes. Art shown is each character's original lesson sketch.</p>
  <h3 class="label">Created avatars</h3>${(p.avatars || []).length ? '' : `<div class="empty glass">No avatars created yet. The creator unlocks at level 5 (you are level ${levelInfo().level}); the full creator is built in Phase 6.</div>`}
  <h3 class="label">Species</h3>${SPECIES.map((s) => {
    const on = U.species.includes(s.id); const lv = unlockLevelFor('species', s.id);
    return `<div class="locked-item glass ${on ? 'on' : ''}">${on ? ICONS.check : ICONS.lock}<div class="grow"><b>${s.name}</b><div class="muted small">${s.desc}</div></div><span class="tag ${on ? 'ok' : ''}">${on ? 'Unlocked' : lv ? `Level ${lv}` : 'Later'}</span></div>`;
  }).join('')}
  <h3 class="label">Titles</h3><div class="chips">${U.titles.map((t) => `<button class="chip ${p.title === t ? 'on' : ''}" data-act="set-title" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
}

function recordsTab() {
  const p = Store.profile; const lib = getLibrary(); const T = p.tutorials || {};
  const done = lib.filter((t) => T[t.id]?.completedAt).sort((a, b) => T[b.id].completedAt - T[a.id].completedAt);
  const inprog = lib.filter((t) => T[t.id] && !T[t.id].completedAt);
  const favs = lib.filter((t) => p.bookmarks.includes(t.id));
  const row = (t, sub) => `<button class="locked-item glass on lesson-row" data-act="go" data-to="drawing" data-tut="${esc(t.id)}"><img src="./${esc(t.thumbnail)}" alt=""><div class="grow"><b>${esc(t.title)}</b><div class="muted small">${sub}</div></div></button>`;
  return `<div class="stat-strip glass"><div><b>${done.length}</b><span>Lessons done</span></div><div><b>${inprog.length}</b><span>In progress</span></div><div><b>${favs.length}</b><span>Favorites</span></div><div><b>${p.stats.missions}</b><span>Missions</span></div></div>
  <h3 class="label">Completed lessons</h3>${done.length ? done.map((t) => row(t, `${t.difficulty} · completed ${new Date(T[t.id].completedAt).toLocaleDateString()} · +${LESSON_XP[t.difficulty]} XP`)).join('') : '<div class="empty glass">No lessons completed yet. Finish every step of a DRAWING lesson to complete it.</div>'}
  ${inprog.length ? `<h3 class="label">In progress</h3>${inprog.map((t) => row(t, `Step ${T[t.id].step + 1} of ${t.steps.length} · ${T[t.id].seen.length} studied`)).join('')}` : ''}
  <h3 class="label">Favorites</h3>${favs.length ? favs.map((t) => row(t, `${t.difficulty} · ${t.steps.length} steps`)).join('') : '<div class="empty glass">No favorites yet. Tap the heart on any lesson.</div>'}
  <h3 class="label">Survival records</h3><div class="empty glass">${p.stats.missions || p.stats.kills ? `Missions ${p.stats.missions} · enemies defeated ${p.stats.kills}` : 'No survival records yet. The first playable round arrives in Phase 3.'}</div>
  <h3 class="label">Rewards & unlock history</h3>
  <ul class="ledger">${p.ledger.slice().reverse().map((e) => `<li><span class="grow">${esc(e.src)}</span><b class="t-pink">+${e.xp} XP</b><time class="muted small">${new Date(e.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</time></li>`).join('') || '<li class="muted">No rewards yet.</li>'}</ul>`;
}

function weaponsTab() { return `<div class="empty glass">0 weapons collected.</div>${phasePanel(3, 'Weapon collection', 'The first weapon (a pistol) arrives with the first playable survival round in Phase 3. Rifles, shotguns, SMGs, snipers, heavy and melee weapons, loadouts and upgrades follow later. Nothing is unlocked yet.')}`; }

function storiesTab() {
  const p = Store.profile;
  return `<h3 class="label">Lore entries</h3>${p.lore.length ? p.lore.map((id) => `<div class="lore glass"><b>${esc(LORE[id]?.title)}</b><p class="muted">${esc(LORE[id]?.body)}</p></div>`).join('') : '<div class="empty glass">No lore discovered yet.</div>'}
  <h3 class="label">Creature records · Discoveries · Event collectibles</h3><div class="empty glass">Found in Survival once playable survival lands (Phase 3) and in later story modes (Phase 7).</div>`;
}

function collection() {
  const U = unlocks(); const p = Store.profile; const lib = getLibrary();
  const lessons = lib.filter((t) => p.tutorials?.[t.id]?.completedAt).length;
  const parts = [['Characters', 0, CANON.length], ['Elements', U.elements.length, ELEMENTS.length], ['Lessons', lessons, lib.length], ['Stories', p.lore.length, Object.keys(LORE).length]];
  const got = parts.reduce((s, x) => s + x[1], 0), all = parts.reduce((s, x) => s + x[2], 0);
  const pc = all ? Math.round((got / all) * 100) : 0;
  return `<section class="card glass coll"><div class="card-head"><h3>Collection progress</h3><b class="t-pink">${pc}%</b></div>${bar(got / all, 'xp big')}
  <div class="coll-row">${parts.map(([n, a, b]) => `<div><span>${n}</span><b>${a} / ${b}</b></div>`).join('')}</div>
  <p class="muted small">Counted from your real unlocks: ${got} of ${all} collectible items discovered in this build.</p></section>`;
}

export function render() {
  const body = { elements: elementsTab, achievements: achievementsTab, characters: charactersTab, records: recordsTab, weapons: weaponsTab, stories: storiesTab }[tab]();
  return `${sectionHeader('VAULT', 'Your collection')}
  ${collection()}
  <div class="seg" role="tablist">${TABS.map(([id, n]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'on' : ''}" data-act="vault-tab" data-id="${id}">${n}</button>`).join('')}</div>
  <div class="vault-body">${body}</div>`;
}

onAction('vault-tab', (el) => { tab = el.dataset.id; play('toggle'); document.dispatchEvent(new Event('rerender')); document.dispatchEvent(new Event('activity')); });
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
