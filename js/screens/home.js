import { Store } from '../store.js';
import { levelInfo, totalXp, unlocks, challengeState, availableRewards, isCreateUnlocked } from '../progression.js';
import { DAILY_CHALLENGES, ACHIEVEMENTS, CREATE_UNLOCK_LEVEL, CURRENT_PHASE, totalXpForLevel } from '../config.js';
import { SPECIES } from '../content.js';
import { esc, ICONS, avatarHTML, bar } from '../ui.js';
import { getLibrary } from './drawing.js';

function msUntilMidnight() { const n = new Date(); const m = new Date(n); m.setHours(24, 0, 0, 0); return m - n; }
export function resetCountdown() {
  const ms = msUntilMidnight(); const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
export function greeting(p) {
  const rewards = availableRewards();
  const open = DAILY_CHALLENGES.filter((c) => { const s = challengeState(c); return s.available && !s.done; });
  if (rewards) return `Welcome back, ${p.username}. ${rewards} reward${rewards > 1 ? 's wait' : ' waits'} for you. Claim ${rewards > 1 ? 'them' : 'it'} below.`;
  if (open.length) return `Welcome back, ${p.username}. Today's path: ${open.map((c) => c.title.toLowerCase()).join(', and ')}.`;
  return `Well done, ${p.username}. Today's challenges are complete. New ones arrive at midnight.`;
}
function ago(t) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
function continueCard(p) {
  const a = p.lastActivity;
  if (!a) return `<section class="card glass cont empty-cont"><div class="card-head"><h3>Continue last activity</h3></div>
    <p class="muted small">Nothing to resume yet. Open a section and it will appear here.</p></section>`;
  return `<button class="card glass cont" data-act="go" data-to="${esc(a.to)}"${a.tab ? ` data-tab="${esc(a.tab)}"` : ''}${a.tut ? ` data-tut="${esc(a.tut)}"` : ''}>
    <div class="card-head"><h3>Continue last activity</h3><span class="muted small">${ago(a.at)}</span></div>
    <div class="row gap"><span class="cont-ic">${ICONS[a.to] || ICONS.home}</span><div class="grow"><b>${esc(a.label)}</b>${a.detail ? `<div class="muted small">${esc(a.detail)}</div>` : ''}</div><span class="chev">${ICONS.back}</span></div></button>`;
}

export function render() {
  const p = Store.profile;
  const L = levelInfo(), xp = totalXp(), U = unlocks();
  const unread = p.notifications.filter((n) => !n.read).length;
  const achDone = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  const rewards = availableRewards();
  const createOpen = isCreateUnlocked();
  const isNew = (p.stats.daysActive <= 1 && Object.keys(p.achievements).length < 3);
  const need5 = totalXpForLevel(CREATE_UNLOCK_LEVEL);
  const recent = p.ledger.slice(-3).reverse();
  const lib = getLibrary(); const libSize = lib.length; const lessonsDone = lib.filter((t) => p.tutorials?.[t.id]?.completedAt).length;

  const challenges = DAILY_CHALLENGES.filter((c) => challengeState(c).available).map((c) => {
    const s = challengeState(c);
    const right = s.claimed ? `<span class="tag ok">${ICONS.check} Claimed</span>`
      : s.done ? `<button class="btn sm pink pulse" data-act="claim" data-id="${c.id}">Claim +${c.xp}</button>` : `<span class="tag">+${c.xp} XP</span>`;
    return `<li class="ch"><div class="ch-main"><div class="ch-title">${esc(c.title)}</div><div class="ch-desc">${esc(c.desc)}</div>
      <div class="ch-prog">${bar(s.progress / s.goal, 'thin')}<span>${s.progress}/${s.goal}</span></div></div><div class="ch-right">${right}</div></li>`;
  }).join('');

  return `
  <header class="topbar">
    <button class="player-card" data-act="go" data-to="settings" data-sec="account" aria-label="Profile and account settings">
      ${avatarHTML(p, 52, 'sq')}
      <div class="pb-text"><div class="pb-name">${esc(p.username)}</div>
        <div class="pb-sub">LEVEL ${L.level} · ${esc(p.title || 'Survivor')}</div>
        ${bar(L.pct, 'xp')}<div class="pb-xp">${L.into} / ${L.need} XP</div></div>
    </button>
    <div class="top-icons">
      <button class="icon-btn" data-act="notifications" aria-label="Notifications">${ICONS.bell}${unread ? `<span class="badge">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
      <button class="icon-btn" data-act="go" data-to="settings" aria-label="Settings">${ICONS.gear}</button>
    </div>
  </header>

  <section class="hero">
    <img class="logo-title" src="./img/logo-title.webp" alt="DRAWING APOCALYPSE" width="900" height="288" decoding="async">
    <button class="orb-hit" data-act="orb-tap" aria-label="Tap ORB for guidance"><div class="orb-slot orb-slot-lg"></div></button>
    <div class="tagline-home">DRAW. LEARN. EVOLVE. <span>SURVIVE.</span></div>
    <div class="orb-msg glass" id="orb-msg"><span class="eyebrow">ORB</span> ${esc(isNew ? `Welcome, ${p.username}. Complete today's challenges to earn experience. Tap me any time for guidance.` : greeting(p))}</div>
    <div class="row gap center"><button class="btn ghost sm" data-act="orb-tap">Hear guidance</button><button class="btn ghost sm" data-act="ask">Ask ORB</button></div>
  </section>

  <section class="modes">
    <button class="mode-tile t-surv" data-act="go" data-to="survival"><span class="mt-ic">${ICONS.survival}</span><b>SURVIVAL</b><small>Enter the apocalypse</small><em>6 modes · playable in Phase 3</em></button>
    <button class="mode-tile t-draw" data-act="go" data-to="drawing"><span class="mt-ic">${ICONS.drawing}</span><b>DRAWING</b><small>Watch. Learn. Evolve.</small><em>${lessonsDone} / ${libSize} lessons done</em></button>
    <button class="mode-tile t-create ${createOpen ? '' : 'locked'}" data-act="go" data-to="create"><span class="mt-ic">${createOpen ? ICONS.create : ICONS.lock}</span><b>CREATE</b>
      <small>${createOpen ? 'Creator unlocked' : `Unlocks at level ${CREATE_UNLOCK_LEVEL}`}</small>${createOpen ? '<em>Unlocked</em>' : `${bar(xp / need5, 'thin')}<em>${xp} / ${need5} XP</em>`}</button>
    <button class="mode-tile t-vault" data-act="go" data-to="vault"><span class="mt-ic">${ICONS.vault}</span><b>VAULT</b><small>Your collection</small><em>${U.elements.length}/30 elements · ${achDone} achievements</em></button>
  </section>
  <button class="play-btn" data-act="go" data-to="survival"><b>PLAY</b><small>CHOOSE YOUR DESTINY</small></button>

  ${continueCard(p)}

  <section class="card glass">
    <div class="card-head"><h3>Daily objectives</h3><span class="muted small">Resets in ${resetCountdown()}</span></div>
    <ul class="ch-list">${challenges}</ul>
  </section>

  <section class="card glass">
    <div class="card-head"><h3>Recent rewards</h3><span class="tag">${rewards} to claim</span></div>
    ${recent.length ? `<ul class="rewards">${recent.map((e) => `<li><span class="rw-xp">+${e.xp}</span><span class="grow">${esc(e.src)}</span><span class="muted small">${ago(e.at)}</span></li>`).join('')}</ul>` : '<p class="muted small">No rewards yet.</p>'}
  </section>

  <section class="card glass progress-card">
    <div class="card-head"><h3>Progression</h3></div>
    <div class="lvl-row"><div class="lvl-big">${L.level}</div><div class="grow"><div class="muted small">Level ${L.level} → ${L.level + 1}</div>${bar(L.pct, 'xp')}<div class="small">${L.into} / ${L.need} XP · ${xp} total</div></div></div>
    <div class="stat-grid">
      <button class="stat" data-act="go" data-to="vault" data-tab="elements"><b>${U.elements.length}<small>/30</small></b><span>Elements</span></button>
      <button class="stat" data-act="go" data-to="vault" data-tab="characters"><b>${U.species.length}<small>/${SPECIES.length}</small></b><span>Species</span></button>
      <button class="stat" data-act="go" data-to="vault" data-tab="achievements"><b>${achDone}<small>/${ACHIEVEMENTS.length}</small></b><span>Achievements</span></button>
      <div class="stat"><b>${p.stats.streak}<small>d</small></b><span>Streak</span></div>
      <div class="stat"><b>${p.stats.dailyDone}</b><span>Objectives</span></div>
      <div class="stat"><b>${p.stats.daysActive}</b><span>Days active</span></div>
    </div>
    <p class="muted small surv-note">Drawing: ${lessonsDone} of ${libSize} lessons completed · ${p.bookmarks.length} favorite${p.bookmarks.length === 1 ? '' : 's'}. Survival records: none yet. Playable survival arrives in Phase 3.</p>
  </section>
  <p class="foot muted small">DRAW. LEARN. EVOLVE. SURVIVE. · Phase ${CURRENT_PHASE} build</p>`;
}
