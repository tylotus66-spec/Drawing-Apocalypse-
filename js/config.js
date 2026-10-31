// DRAWING APOCALYPSE — central configuration.
// Progression rules, unlock table, challenges and achievements live here so they
// can be tuned WITHOUT rewriting the app (spec §16). When a backend exists, the
// same table should be served/validated by the server.

export const APP_VERSION = '0.2.0-phase2';

// ---- XP curve -------------------------------------------------------------
// XP needed to go from level L to L+1 = BASE + STEP * (L - 1)
// Level 2 = 100 XP total, 3 = 250, 4 = 450, 5 = 700, 6 = 1000 ...
export const XP_CURVE = { BASE: 100, STEP: 50, MAX_LEVEL: 100 };

export function xpToNext(level) {
  return XP_CURVE.BASE + XP_CURVE.STEP * (level - 1);
}
export function totalXpForLevel(level) {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpToNext(l);
  return t;
}
export function levelFromXp(xp) {
  let level = 1;
  while (level < XP_CURVE.MAX_LEVEL && xp >= totalXpForLevel(level + 1)) level++;
  const base = totalXpForLevel(level);
  const need = xpToNext(level);
  return { level, into: xp - base, need, pct: Math.min(1, (xp - base) / need) };
}

// ---- Starting kit ---------------------------------------------------------
// Design decision (not stated in the spec): every new player starts with FIRE
// unlocked and the HUMAN species so the Vault is never empty. Change here.
export const START_UNLOCKS = {
  elements: ['FIRE'],
  species: ['HUMAN'],
  features: [],
  titles: ['Survivor'],
};

// ---- Level unlock table (spec §16: Level 5 = official avatar creator) -----
// Each entry is granted once when the player reaches that level.
export const LEVEL_UNLOCKS = {
  2: { titles: ['Ash Walker'] },
  3: { elements: ['AIR'] },
  4: { titles: ['Ember Scout'] },
  5: { features: ['CREATE'], species: ['HUMANOID'], titles: ['Shaper'] },
  6: { elements: ['WATER'] },
  7: { species: ['CRYPTID'] },
  8: { elements: ['EARTH'] },
  10: { elements: ['LIGHTNING'], species: ['DRAGON'] },
  12: { elements: ['ICE'] },
  14: { elements: ['NATURE'], species: ['DINOSAUR'] },
  16: { elements: ['SHADOW'] },
  18: { elements: ['LIGHT'] },
  20: { elements: ['COSMIC'] },
};

export const CREATE_UNLOCK_LEVEL = 5;

// ---- XP rewards ------------------------------------------------------------
export const REWARDS = {
  onboarding: { id: 'once:onboarding', xp: 100, label: 'Completed ORB awakening' },
};

// ---- Daily challenges (spec §17). Phase marks when a challenge goes live. --
// `goal` is checked against the daily counters in the profile. Every reward is
// claimed through the progression ledger with a date-scoped id, so it can only
// be paid once per day.
export const DAILY_CHALLENGES = [
  { id: 'talk-orb', title: 'Talk to ORB', desc: 'Tap ORB for guidance or ask the guide a question.', xp: 25, counter: 'talked', goal: 1, phase: 1 },
  { id: 'visit-all', title: 'Visit every section', desc: 'Open HOME, DRAWING, SURVIVAL, CREATE and VAULT today.', xp: 40, counter: 'visitedCount', goal: 5, phase: 1 },
  { id: 'draw-lesson', title: 'Complete a drawing lesson', desc: 'Finish any tutorial in the DRAWING library.', xp: 60, counter: 'lessons', goal: 1, phase: 2 },
  { id: 'survive-mission', title: 'Survive a mission', desc: 'Complete a survival mission and extract.', xp: 80, counter: 'missions', goal: 1, phase: 4 },
  { id: 'defeat-enemies', title: 'Defeat enemies', desc: 'Defeat 25 enemies in SURVIVAL.', xp: 50, counter: 'kills', goal: 25, phase: 3 },
  { id: 'use-elements', title: 'Use elemental abilities', desc: 'Cast 10 elemental abilities.', xp: 50, counter: 'casts', goal: 10, phase: 5 },
];

export const WEEKLY_CHALLENGES = [
  { id: 'w-missions', title: 'Complete multiple missions', desc: 'Complete 5 missions this week.', phase: 4 },
  { id: 'w-master', title: 'Master an element', desc: 'Raise any element to mastery rank 3.', phase: 5 },
  { id: 'w-advanced', title: 'Complete advanced tutorials', desc: 'Finish 2 Advanced drawing tutorials.', phase: 2 },
  { id: 'w-multi', title: 'Participate in multiplayer', desc: 'Play 3 online matches.', phase: 9 },
];

// ---- Achievements (spec §15). `stat` + `goal` drive real progress. --------
export const ACHIEVEMENTS = [
  { id: 'first-steps', title: 'First Steps', desc: 'Complete the ORB awakening.', cat: 'Exploration', stat: 'onboarded', goal: 1, xp: 50, phase: 1 },
  { id: 'explorer', title: 'Explorer', desc: 'Visit all five sections.', cat: 'Exploration', stat: 'sectionsEver', goal: 5, xp: 50, phase: 1 },
  { id: 'curious', title: 'Curious Mind', desc: 'Ask ORB 5 questions.', cat: 'Exploration', stat: 'questions', goal: 5, xp: 25, phase: 1 },
  { id: 'listener', title: 'Listener', desc: 'Receive guidance from ORB 10 times.', cat: 'Exploration', stat: 'orbTalks', goal: 10, xp: 25, phase: 1 },
  { id: 'element-seeker', title: 'Element Seeker', desc: 'Study an element in the Vault.', cat: 'Elemental mastery', stat: 'elementsViewed', goal: 1, xp: 25, phase: 1 },
  { id: 'dedicated', title: 'Dedicated', desc: 'Return 3 days in a row.', cat: 'Exploration', stat: 'bestStreak', goal: 3, xp: 75, phase: 1 },
  { id: 'devoted', title: 'Devoted', desc: 'Return 7 days in a row.', cat: 'Exploration', stat: 'bestStreak', goal: 7, xp: 150, phase: 1 },
  { id: 'challenger', title: 'Challenger', desc: 'Complete 5 daily challenges.', cat: 'Exploration', stat: 'dailyDone', goal: 5, xp: 75, phase: 1 },
  { id: 'first-lesson', title: 'First Lesson', desc: 'Complete a drawing tutorial.', cat: 'Drawing', stat: 'tutorialsCompleted', goal: 1, xp: 50, phase: 2 },
  { id: 'first-blood', title: 'First Blood', desc: 'Defeat your first enemy.', cat: 'Combat', stat: 'kills', goal: 1, xp: 50, phase: 3 },
  { id: 'extraction', title: 'Extraction', desc: 'Complete a mission and extract.', cat: 'Mission completion', stat: 'missions', goal: 1, xp: 100, phase: 4 },
  { id: 'survivor-10', title: 'Hardened Survivor', desc: 'Survive 10 missions.', cat: 'Survival', stat: 'missions', goal: 10, xp: 200, phase: 4 },
  { id: 'elemental-adept', title: 'Elemental Adept', desc: 'Cast 100 elemental abilities.', cat: 'Elemental mastery', stat: 'casts', goal: 100, xp: 150, phase: 5 },
  { id: 'multiplayer-debut', title: 'Not Alone', desc: 'Finish an online match.', cat: 'Multiplayer', stat: 'onlineMatches', goal: 1, xp: 100, phase: 9 },
];

export const CURRENT_PHASE = 2;
