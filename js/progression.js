// Unified progression (spec §16). ALL XP changes go through award(), which
// writes to an append-only ledger keyed by a unique reward id, so the same
// reward can never be paid twice. Level and unlocks are DERIVED from the
// ledger, so the Vault can never show something the player has not earned.
import { Store, todayKey } from './store.js';
import {
  levelFromXp, LEVEL_UNLOCKS, START_UNLOCKS, DAILY_CHALLENGES, ACHIEVEMENTS,
  REWARDS, CURRENT_PHASE, CREATE_UNLOCK_LEVEL,
} from './config.js';
import { ELEMENTS, LORE } from './content.js';

const P = () => Store.profile;
const SECTION_IDS = ['home', 'drawing', 'survival', 'create', 'vault'];

export function totalXp(p = P()) { return p ? p.ledger.reduce((s, e) => s + e.xp, 0) : 0; }
export function levelInfo(p = P()) { return levelFromXp(totalXp(p)); }
export function hasClaimed(id, p = P()) { return !!p && p.ledger.some((e) => e.id === id); }

export function unlocksForLevel(level) {
  const out = { elements: [...START_UNLOCKS.elements], species: [...START_UNLOCKS.species], features: [...START_UNLOCKS.features], titles: [...START_UNLOCKS.titles] };
  Object.keys(LEVEL_UNLOCKS).map(Number).sort((a, b) => a - b).forEach((lv) => {
    if (lv > level) return;
    const u = LEVEL_UNLOCKS[lv];
    for (const k of Object.keys(out)) if (u[k]) out[k].push(...u[k]);
  });
  // keep official order for elements
  out.elements = ELEMENTS.map((e) => e.id).filter((id) => out.elements.includes(id));
  return out;
}
export function unlocks() { return unlocksForLevel(levelInfo().level); }
export function isCreateUnlocked() { return levelInfo().level >= CREATE_UNLOCK_LEVEL; }

function emit(type, detail) { Store.emit('progress', { type, ...detail }); }

export function notify(p, kind, title, body) {
  const s = Store.settings;
  if ((kind === 'achievement' && !s.notifyAchievements) || (kind === 'challenge' && !s.notifyChallenges) || (kind === 'unlock' && !s.notifyUnlocks)) return;
  p.notifications.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kind, title, body, at: Date.now(), read: false });
  p.notifications = p.notifications.slice(0, 60);
}

/** The ONLY way XP is granted. Returns false if this reward id was already paid. */
export function award(id, xp, src) {
  const p = P();
  if (!p || hasClaimed(id, p) || !(xp > 0) || xp > 1000) return false;
  const before = levelInfo(p).level;
  let after = before;
  Store.updateProfile((pp) => {
    pp.ledger.push({ id, xp, src, at: Date.now() });
    after = levelInfo(pp).level;
    if (after > before) {
      notify(pp, 'level', `Level ${after} reached`, 'Your power grows.');
      for (let lv = before + 1; lv <= after; lv++) {
        const u = LEVEL_UNLOCKS[lv];
        if (!u) continue;
        const parts = [];
        (u.elements || []).forEach((e) => parts.push(`${e} element`));
        (u.species || []).forEach((s) => parts.push(`${s.toLowerCase()} species`));
        (u.features || []).forEach((f) => parts.push(`${f} section`));
        (u.titles || []).forEach((t) => parts.push(`title “${t}”`));
        if (parts.length) notify(pp, 'unlock', `Unlocked at level ${lv}`, parts.join(', '));
      }
    }
  });
  emit('xp', { id, xp, src });
  if (after > before) emit('levelup', { from: before, to: after });
  checkAchievements();
  return true;
}

// ---- daily rollover & streak ---------------------------------------------
export function rolloverIfNeeded() {
  const p = P();
  if (!p) return false;
  const today = todayKey();
  if (p.daily.date === today && p.stats.lastDay === today) return false;
  let changed = false;
  Store.updateProfile((pp) => {
    if (pp.daily.date !== today) {
      pp.daily = { date: today, visited: [], talked: 0, lessons: 0, missions: 0, kills: 0, casts: 0 };
      changed = true;
    }
    if (pp.stats.lastDay !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      pp.stats.streak = pp.stats.lastDay === todayKey(y) ? pp.stats.streak + 1 : 1;
      pp.stats.bestStreak = Math.max(pp.stats.bestStreak, pp.stats.streak);
      pp.stats.daysActive += 1;
      pp.stats.lastDay = today;
      if (changed && pp.onboarded) notify(pp, 'challenge', 'New daily challenges', 'Fresh challenges are waiting on HOME.');
      changed = true;
    }
  });
  if (changed) { emit('daily', {}); checkAchievements(); }
  return changed;
}

// ---- activity recorders ----------------------------------------------------
export function recordVisit(section) {
  const p = P();
  if (!p || !SECTION_IDS.includes(section)) return;
  if (p.daily.visited.includes(section) && p.stats.sectionsVisited.includes(section)) return;
  const wasDone = challengeState(DAILY_CHALLENGES[1]).done;
  Store.updateProfile((pp) => {
    if (!pp.daily.visited.includes(section)) pp.daily.visited.push(section);
    if (!pp.stats.sectionsVisited.includes(section)) pp.stats.sectionsVisited.push(section);
  });
  afterActivity('visit-all', wasDone);
}
export function recordOrbTalk(kind = 'tip') {
  const p = P();
  if (!p) return;
  const wasDone = challengeState(DAILY_CHALLENGES[0]).done;
  Store.updateProfile((pp) => {
    pp.daily.talked += 1;
    pp.stats.orbTalks += 1;
    if (kind === 'question') pp.stats.questions += 1;
  });
  afterActivity('talk-orb', wasDone);
}
export function recordElementView() {
  if (!P()) return;
  Store.updateProfile((pp) => { pp.stats.elementsViewed += 1; });
  checkAchievements();
}
function afterActivity(chId, wasDone) {
  const ch = DAILY_CHALLENGES.find((c) => c.id === chId);
  if (!wasDone && challengeState(ch).done) {
    Store.updateProfile((pp) => notify(pp, 'challenge', `Challenge complete: ${ch.title}`, `Claim +${ch.xp} XP on HOME.`));
    emit('challenge', { ch });
  }
  checkAchievements();
}

// ---- challenges ------------------------------------------------------------
function dailyCounter(p, counter) {
  if (counter === 'visitedCount') return p.daily.visited.length;
  return p.daily[counter] || 0;
}
export function challengeRewardId(ch, p = P()) { return `daily:${ch.id}:${p.daily.date}`; }
export function challengeState(ch, p = P()) {
  if (!p) return { progress: 0, goal: ch.goal, done: false, claimed: false, available: false };
  const available = ch.phase <= CURRENT_PHASE;
  const progress = available ? Math.min(ch.goal, dailyCounter(p, ch.counter)) : 0;
  const done = available && progress >= ch.goal;
  const claimed = hasClaimed(challengeRewardId(ch, p), p);
  return { progress, goal: ch.goal, done, claimed, available };
}
export function claimChallenge(chId) {
  rolloverIfNeeded();
  const ch = DAILY_CHALLENGES.find((c) => c.id === chId);
  const st = challengeState(ch);
  if (!st.done || st.claimed) return false;
  const ok = award(challengeRewardId(ch), ch.xp, `Daily: ${ch.title}`);
  if (ok) { Store.updateProfile((pp) => { pp.stats.dailyDone += 1; }); checkAchievements(); }
  return ok;
}
export function availableRewards() {
  return DAILY_CHALLENGES.filter((c) => { const s = challengeState(c); return s.done && !s.claimed; }).length;
}

// ---- onboarding --------------------------------------------------------------
export function completeOnboarding() {
  Store.updateProfile((pp) => {
    pp.onboarded = true;
    if (!pp.lore.includes('orb-awakening')) pp.lore.push('orb-awakening');
    notify(pp, 'unlock', 'Lore entry discovered', LORE['orb-awakening'].title);
  });
  award(REWARDS.onboarding.id, REWARDS.onboarding.xp, REWARDS.onboarding.label);
  checkAchievements();
}

// ---- achievements ---------------------------------------------------------------
export function achievementProgress(a, p = P()) {
  if (!p) return { value: 0, goal: a.goal, unlocked: false, available: false };
  const s = p.stats;
  const map = { onboarded: p.onboarded ? 1 : 0, sectionsEver: s.sectionsVisited.length };
  const value = Math.min(a.goal, map[a.stat] ?? s[a.stat] ?? 0);
  return { value, goal: a.goal, unlocked: !!p.achievements[a.id], available: a.phase <= CURRENT_PHASE };
}
let checking = false;
export function checkAchievements() {
  const p = P();
  if (!p || checking) return;
  checking = true;
  try {
    for (const a of ACHIEVEMENTS) {
      const st = achievementProgress(a, p);
      if (st.unlocked || !st.available || st.value < a.goal) continue;
      Store.updateProfile((pp) => {
        pp.achievements[a.id] = Date.now();
        notify(pp, 'achievement', `Achievement: ${a.title}`, `${a.desc} +${a.xp} XP`);
      });
      emit('achievement', { a });
      award(`ach:${a.id}`, a.xp, `Achievement: ${a.title}`);
    }
  } finally { checking = false; }
}
