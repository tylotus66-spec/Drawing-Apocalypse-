// Data layer. The app only talks to `Store` (profile + settings) through this
// module. Persistence goes through a storage ADAPTER so a real backend
// (e.g. Supabase / custom API with server-side validation) can replace the
// local adapter later without touching screens. See README "Backend".

const NS = 'da.v1.';

/** Local adapter: browser localStorage, async interface to match a remote API. */
export class LocalAdapter {
  constructor() { this.kind = 'local'; }
  async get(key) {
    try { const v = localStorage.getItem(NS + key); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  async set(key, value) { localStorage.setItem(NS + key, JSON.stringify(value)); }
  async remove(key) { localStorage.removeItem(NS + key); }
}

/**
 * Remote adapter contract (not connected in Phase 1).
 * A backend implementation must provide the same async get/set/remove plus
 * auth (register/login/logout) and must validate progression server-side:
 * the client sends EVENTS (e.g. "challenge talk-orb completed"), the server
 * decides XP. Never trust client-sent XP.
 */
export class RemoteAdapter {
  constructor(config) { this.kind = 'remote'; this.config = config; }
  async get() { throw new Error('Remote backend not configured'); }
  async set() { throw new Error('Remote backend not configured'); }
  async remove() { throw new Error('Remote backend not configured'); }
}

export const DEFAULT_SETTINGS = {
  masterVolume: 0.8, musicVolume: 0.35, sfxVolume: 0.7, voiceVolume: 0.9,
  voiceEnabled: true, subtitles: true, subtitleSize: 'medium', voiceURI: '',
  language: 'en',
  graphics: 'high', fps: 60,
  cameraSensitivity: 50, aimSensitivity: 50,
  controlLayout: 'standard', buttonSize: 100,
  controllerVibration: true, vibration: true,
  uiScale: 100,
  reduceMotion: false, highContrast: false, largeText: false,
  notifyAchievements: true, notifyChallenges: true, notifyUnlocks: true,
  shareAnalytics: false,
};

export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function newProfile(username) {
  const now = Date.now();
  return {
    schema: 1,
    id: 'local-' + now.toString(36) + Math.random().toString(36).slice(2, 8),
    username, avatar: null, title: 'Survivor',
    createdAt: now, lastActive: now,
    onboarded: false,
    ledger: [],          // [{id, xp, src, at}] — single source of truth for XP
    achievements: {},    // id -> unlockedAt
    notifications: [],   // [{id, kind, title, body, at, read}]
    bookmarks: [],       // tutorial ids
    lore: [],
    stats: {
      orbTalks: 0, questions: 0, elementsViewed: 0, dailyDone: 0,
      tutorialsCompleted: 0, missions: 0, kills: 0, casts: 0, onlineMatches: 0,
      sectionsVisited: [], streak: 0, bestStreak: 0, lastDay: null, daysActive: 0, sessions: 0,
    },
    daily: { date: todayKey(), visited: [], talked: 0, lessons: 0, missions: 0, kills: 0, casts: 0 },
    integrity: null,
  };
}

// Tiny FNV-1a hash used to detect casual edits to the local save.
// This is NOT security — real anti-cheat requires server validation.
export function hashLedger(ledger) {
  const s = 'da-salt-7f3|' + ledger.map((e) => `${e.id}:${e.xp}`).join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

class StoreImpl extends EventTarget {
  constructor(adapter) {
    super();
    this.adapter = adapter;
    this.profile = null;
    this.settings = { ...DEFAULT_SETTINGS };
    this.tampered = false;
    this._saveTimer = null;
  }
  async init() {
    const s = await this.adapter.get('settings');
    if (s) this.settings = { ...DEFAULT_SETTINGS, ...s };
    const p = await this.adapter.get('profile');
    if (p && p.schema === 1) {
      const fresh = newProfile(p.username);
      this.profile = { ...fresh, ...p, stats: { ...fresh.stats, ...p.stats }, daily: { ...fresh.daily, ...p.daily } };
      if (this.profile.integrity && this.profile.integrity !== hashLedger(this.profile.ledger)) this.tampered = true;
    }
  }
  hasAccount() { return !!this.profile; }
  // ---- account API (local implementation) ----
  async createAccount(username) {
    this.profile = newProfile(username);
    await this.flush();
    this.emit('account');
    return this.profile;
  }
  async deleteAccount() {
    await this.adapter.remove('profile');
    this.profile = null;
    this.emit('account');
  }
  updateProfile(mutator) {
    mutator(this.profile);
    this.profile.integrity = hashLedger(this.profile.ledger);
    this.scheduleSave();
    this.emit('change');
  }
  setSetting(key, value) {
    this.settings[key] = value;
    this.adapter.set('settings', this.settings);
    this.emit('settings', { key, value });
  }
  scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.flush(), 150);
  }
  async flush() {
    clearTimeout(this._saveTimer);
    if (this.profile) { this.profile.integrity = hashLedger(this.profile.ledger); await this.adapter.set('profile', this.profile); }
  }
  exportSave() {
    return JSON.stringify({ app: 'drawing-apocalypse', exportedAt: new Date().toISOString(), profile: this.profile, settings: this.settings }, null, 2);
  }
  async importSave(text) {
    const data = JSON.parse(text);
    if (data.app !== 'drawing-apocalypse' || !data.profile || data.profile.schema !== 1) throw new Error('Not a Drawing Apocalypse save file');
    if (data.profile.integrity !== hashLedger(data.profile.ledger || [])) throw new Error('Save file failed its integrity check');
    this.profile = data.profile;
    if (data.settings) this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    await this.adapter.set('settings', this.settings);
    await this.flush();
    this.emit('account');
  }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
}

export const Store = new StoreImpl(new LocalAdapter());
window.addEventListener('pagehide', () => Store.flush());
document.addEventListener('visibilitychange', () => { if (document.hidden) Store.flush(); });
