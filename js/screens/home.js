import { Store } from '../store.js';
import { levelInfo, totalXp, unlocks, challengeState, availableRewards, isCreateUnlocked } from '../progression.js';
import { DAILY_CHALLENGES, ACHIEVEMENTS, CREATE_UNLOCK_LEVEL, CURRENT_PHASE } from '../config.js';
import { SPECIES } from '../content.js';
import { esc, ICONS, avatarHTML, bar } from '../ui.js';

function msUntilMidnight() {
  const n = new Date(); const m = new Date(n); m.setHours(24, 0, 0, 0); return m - n;
}
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

export function render() {
  const p = Store.profile;
  const L = levelInfo(), xp = totalXp(), U = unlocks();
  const unread = p.notifications.filter((n) => !n.read).length;
  const achDone = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  const rewards = availableRewards();
  const createOpen = isCreateUnlocked();
  const isNew = (p.stats.daysActive <= 1 && Object.keys(p.achievements).length < 3);

  const challenges = DAILY_CHALLENGES.map((c) => {
    const s = challengeState(c);
    let right;
    if (!s.available) right = `<span class="tag">Phase ${c.phase}</span>`;
    else if (s.claimed) right = `<span class="tag ok">${ICONS.check} Claimed</span>`;
    else if (s.done) right = `<button class="btn sm pink pulse" data-act="claim" data-id="${c.id}">Claim +${c.xp}</button>`;
    else right = `<span class="tag">+${c.xp} XP</span>`;
    return `<li class="ch ${s.available ? '' : 'dim'}">
      <div class="ch-main"><div class="ch-title">${esc(c.title)}</div><div class="ch-desc">${esc(c.desc)}</div>
      ${s.available ? `<div class="ch-prog">${bar(s.progress / s.goal, 'thin')}<span>${s.progress}/${s.goal}</span></div>` : '<div class="ch-desc">Unlocks when this system ships.</div>'}</div>
      <div class="ch-right">${right}</div></li>`;
  }).join('');

  return `
  <header class="topbar">
    <button class="profile-btn" data-act="go" data-to="settings" data-sec="account" aria-label="Account settings">
      ${avatarHTML(p, 46)}
      <div class="pb-text"><div class="pb-name">${esc(p.username)}</div>
        <div class="pb-sub"><span class="lvl">LV ${L.level}</span> ${esc(p.title || 'Survivor')}</div>
        ${bar(L.pct, 'xp')}<div class="pb-xp">${L.into} / ${L.need} XP</div></div>
    </button>
    <button class="icon-btn" data-act="notifications" aria-label="Notifications">${ICONS.bell}${unread ? `<span class="badge">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
    <button class="icon-btn" data-act="go" data-to="settings" aria-label="Settings">${ICONS.gear}</button>
  </header>

  <section class="hero">
    <button class="orb-hit" data-act="orb-tap" aria-label="Tap ORB for guidance"><div class="orb-slot orb-slot-lg"></div></button>
    <div class="hero-cap"><span class="eyebrow">ORB · THE ETERNAL GUIDE</span></div>
    <div class="orb-msg glass" id="orb-msg">${esc(isNew ? `Welcome, ${p.username}. Complete today's challenges to earn experience. Tap me any time for guidance.` : greeting(p))}</div>
    <div class="row gap center"><button class="btn ghost sm" data-act="orb-tap">Hear guidance</button><button class="btn ghost sm" data-act="ask">Ask ORB</button></div>
  </section>

  <section class="actions">
    <button class="action a-surv" data-act="go" data-to="survival"><span class="ai">${ICONS.survival}</span><b>ENTER SURVIVAL</b><small>Landscape · Phase 3</small></button>
    <button class="action a-draw" data-act="go" data-to="drawing" data-tut="fire-wyvern"><span class="ai">${ICONS.drawing}</span><b>CONTINUE DRAWING</b><small>Fire Wyvern</small></button>
    <button class="action a-create ${createOpen ? '' : 'locked'}" data-act="go" data-to="create"><span class="ai">${createOpen ? ICONS.create : ICONS.lock}</span><b>CREATE AVATAR</b><small>${createOpen ? 'Unlocked' : `Level ${CREATE_UNLOCK_LEVEL} required`}</small></button>
    <button class="action a-vault" data-act="go" data-to="vault"><span class="ai">${ICONS.vault}</span><b>OPEN VAULT</b><small>${U.elements.length}/30 elements</small></button>
  </section>

  <section class="card glass">
    <div class="card-head"><h3>Daily challenges</h3><span class="muted small">Resets in ${resetCountdown()}</span></div>
    <ul class="ch-list">${challenges}</ul>
  </section>

  <section class="card glass progress-card">
    <div class="card-head"><h3>Progression</h3><span class="tag">${rewards} reward${rewards === 1 ? '' : 's'} available</span></div>
    <div class="lvl-row"><div class="lvl-big">${L.level}</div><div class="grow"><div class="muted small">Level ${L.level} → ${L.level + 1}</div>${bar(L.pct, 'xp')}<div class="small">${L.into} / ${L.need} XP · ${xp} total</div></div></div>
    <div class="stat-grid">
      <button class="stat" data-act="go" data-to="vault" data-tab="elements"><b>${U.elements.length}<small>/30</small></b><span>Elements</span></button>
      <button class="stat" data-act="go" data-to="vault" data-tab="characters"><b>${U.species.length}<small>/${SPECIES.length}</small></b><span>Species</span></button>
      <button class="stat" data-act="go" data-to="vault" data-tab="achievements"><b>${achDone}<small>/${ACHIEVEMENTS.length}</small></b><span>Achievements</span></button>
      <div class="stat"><b>${p.stats.missions}</b><span>Missions</span></div>
      <div class="stat"><b>${p.stats.tutorialsCompleted}</b><span>Tutorials</span></div>
      <div class="stat"><b>${p.stats.streak}<small>d</small></b><span>Streak</span></div>
    </div>
  </section>

  <section class="feature glass f-mission">
    <div class="eyebrow">Featured survival mission</div>
    <h3>OPERATION: FIRST LIGHT</h3>
    <p class="muted">Ruined City · Push through the burning district, recover the signal beacon and reach extraction.</p>
    <div class="row between"><span class="tag">Arrives in Phase 4</span><button class="btn sm" data-act="go" data-to="survival">Enter Survival</button></div>
  </section>

  <section class="feature glass f-tut">
    <div class="eyebrow">Featured drawing tutorial</div>
    <h3>FIRE WYVERN — 12 STEPS</h3>
    <p class="muted">Dragons · Intermediate. From basic construction to fire effects and final details.</p>
    <div class="row between"><span class="tag">Video arrives in Phase 2</span><button class="btn sm" data-act="go" data-to="drawing" data-tut="fire-wyvern">View lesson</button></div>
  </section>

  <section class="card glass avatar-card">
    <div class="card-head"><h3>Current avatar</h3><span class="tag">${esc(p.title || 'Survivor')}</span></div>
    <div class="row gap">${avatarHTML(p, 64)}<div><b>${esc(p.username)}</b><div class="muted small">Human · Fire element</div>
      <div class="muted small">${createOpen ? 'The creator is unlocked.' : `Custom avatars unlock at level ${CREATE_UNLOCK_LEVEL}.`}</div></div></div>
  </section>

  <section class="card glass">
    <div class="card-head"><h3>Player statistics</h3></div>
    <dl class="kv">
      <dt>Total XP</dt><dd>${xp}</dd>
      <dt>Days active</dt><dd>${p.stats.daysActive}</dd>
      <dt>Best streak</dt><dd>${p.stats.bestStreak} days</dd>
      <dt>Daily challenges done</dt><dd>${p.stats.dailyDone}</dd>
      <dt>Guidance from ORB</dt><dd>${p.stats.orbTalks}</dd>
      <dt>Questions asked</dt><dd>${p.stats.questions}</dd>
      <dt>Enemies defeated</dt><dd>${p.stats.kills}</dd>
      <dt>Sections discovered</dt><dd>${p.stats.sectionsVisited.length}/5</dd>
      <dt>Member since</dt><dd>${new Date(p.createdAt).toLocaleDateString()}</dd>
    </dl>
  </section>
  <p class="foot muted small">DRAW. LEARN. EVOLVE. SURVIVE. · Phase ${CURRENT_PHASE} build</p>`;
}
