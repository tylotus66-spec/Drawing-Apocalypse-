// DRAWING APOCALYPSE — app bootstrap, router and global wiring.
import { Store } from './store.js';
import { rolloverIfNeeded, recordVisit, claimChallenge, checkAchievements, levelInfo } from './progression.js';
import { LEVEL_UNLOCKS, DAILY_CHALLENGES } from './config.js';
import { Orb } from './orb.js';
import { say, stopSpeaking } from './voice.js';
import { unlockAudio, play, applyVolumes } from './audio.js';
import { tapOrb, openAsk, setRemount } from './guide.js';
import { startEmbers } from './fx.js';
import { onAction, toast, openSheet, closeSheet, sheetOpen, esc, ICONS } from './ui.js';
import * as Home from './screens/home.js';
import * as Drawing from './screens/drawing.js';
import * as Survival from './screens/survival.js';
import * as Create from './screens/create.js';
import * as Vault from './screens/vault.js';
import * as Settings from './screens/settings.js';
import { startOnboarding } from './screens/onboarding.js';
import { startGamepadNav } from './gamepad.js';

const SCREENS = { home: Home, drawing: Drawing, survival: Survival, create: Create, vault: Vault, settings: Settings };
const TABS = ['home', 'drawing', 'survival', 'create', 'vault'];
let current = null, lastTab = 'home', embers = null, onboardingOpen = false;
const $ = (s) => document.querySelector(s);

// ---------- rendering ----------
function mountOrb(root) {
  if (onboardingOpen || (sheetOpen() && $('#sheet-root .orb-slot'))) return;
  const slot = (root || $('.screen.active'))?.querySelector('.orb-slot');
  if (slot) Orb.mount(slot);
}
setRemount(() => mountOrb());

function show(name, { anim = true, restore = false } = {}) {
  if (!SCREENS[name] || !Store.profile) return;
  const mod = SCREENS[name];
  const host = $('#screens');
  const old = host.querySelector('.screen.active');
  const sec = document.createElement('section');
  sec.className = `screen screen-${name}`;
  sec.innerHTML = `<div class="screen-scroll">${mod.render()}</div>`;
  host.appendChild(sec);
  mod.bind?.(sec);
  const dir = old ? (TABS.indexOf(name) >= TABS.indexOf(current) ? 1 : -1) : 0;
  requestAnimationFrame(() => {
    sec.classList.add('active');
    if (anim && dir && !Store.settings.reduceMotion) sec.animate([{ opacity: 0, transform: `translateX(${dir * 24}px) scale(.985)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  if (old) {
    old.classList.remove('active');
    if (anim && !Store.settings.reduceMotion) old.animate([{ opacity: 1 }, { opacity: 0, transform: `translateX(${-dir * 24}px)` }], { duration: 220, easing: 'ease-in' }).onfinish = () => old.remove();
    else old.remove();
  }
  current = name;
  if (TABS.includes(name)) lastTab = name;
  document.body.dataset.screen = name;
  document.querySelectorAll('#tabbar [data-tab]').forEach((b) => { const on = b.dataset.tab === name; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  embers?.setIntensity(name === 'home' ? 1 : 0.45);
  mountOrb(sec);
  if (TABS.includes(name)) { recordVisit(name); if (!restore) recordActivity(name); } // a cold start must not overwrite the real last activity
  updateTabBadges();
}

let rr = 0;
function rerender() {
  cancelAnimationFrame(rr);
  rr = requestAnimationFrame(() => {
    const sec = $('.screen.active'); if (!sec || !current || !Store.profile) return;
    const sc = sec.querySelector('.screen-scroll'); const top = sc?.scrollTop || 0;
    const ae = document.activeElement; if (ae && sec.contains(ae) && /INPUT|SELECT|TEXTAREA/.test(ae.tagName)) return; // don't clobber typing
    sec.innerHTML = `<div class="screen-scroll">${SCREENS[current].render()}</div>`;
    SCREENS[current].bind?.(sec);
    sec.querySelector('.screen-scroll').scrollTop = top;
    mountOrb(sec);
    updateTabBadges();
  });
}
document.addEventListener('rerender', rerender);

function updateTabBadges() {
  const b = $('#tabbar [data-tab="create"]');
  if (b && Store.profile) b.classList.toggle('locked', levelInfo().level < 5);
}

// ---------- navigation ----------
function navigate(name, opts = {}) {
  if (name === current && !opts.force) { rerender(); return; }
  play('nav');
  if (current === 'survival' && name !== 'survival') Survival.exitSurvival();
  if (current === 'drawing' && name !== 'drawing') Drawing.leaveDrawing();
  stopSpeaking();
  show(name);
  if (location.hash !== '#/' + name) history.replaceState(null, '', '#/' + name);
}

onAction('nav', (el) => { unlockAudio(); const t = el.dataset.tab; if (t === 'drawing' && current === 'drawing') Drawing.resetDrawingView(); navigate(t, { force: t === 'drawing' }); });
onAction('go', (el) => {
  unlockAudio();
  const to = el.dataset.to;
  if (to === 'drawing') { Drawing.resetDrawingView(); if (el.dataset.tut) Drawing.openTutorial(el.dataset.tut); }
  if (to === 'vault' && el.dataset.tab) Vault.setVaultTab(el.dataset.tab);
  if (to === 'settings') Settings.openSection(el.dataset.sec || null);
  closeSheet(true);
  navigate(to, { force: true });
});
onAction('back', () => {
  if (current === 'drawing' && Drawing.drawingDepth()) { Drawing.drawingBack(); play('nav'); rerender(); recordActivity('drawing'); return; }
  if (current === 'settings' && Settings.sectionOpen()) { Settings.closeSection(); play('nav'); rerender(); return; }
  if (current === 'settings') { navigate(lastTab || 'home'); return; }
  if (current === 'survival' && Survival.inArena()) { Survival.exitSurvival().then(() => { rerender(); recordActivity('survival'); }); return; }
  navigate('home');
});

// Continue Last Activity: remember the last real place the player was (silent, no re-render).
const VAULT_TABS = { elements: 'Elements', achievements: 'Achievements', characters: 'Characters', drawing: 'Drawing', weapons: 'Weapons', collectibles: 'Collectibles' };
export function recordActivity(name) {
  if (!Store.profile || !['drawing', 'survival', 'create', 'vault'].includes(name)) return;
  let a = { to: name, at: Date.now(), label: name.toUpperCase() };
  if (name === 'vault') { const t = Vault.getVaultTab(); a.tab = t; a.label = 'VAULT'; a.detail = VAULT_TABS[t] || ''; }
  if (name === 'drawing') { const v = Drawing.drawingContext(); a.label = 'DRAWING'; a.detail = v.label; if (v.tut) a.tut = v.tut; }
  if (name === 'survival') { const m = Survival.selectedMode(); a.detail = m ? `Mode: ${m.name}` : 'Mode select'; }
  if (name === 'create') a.detail = Store.profile && levelInfo().level >= 5 ? 'Creator unlocked' : 'Level 5 unlock progress';
  Store.updateProfile((p) => { p.lastActivity = a; }, { silent: true });
}
document.addEventListener('activity', () => recordActivity(current));
onAction('exit-survival', async () => { await Survival.exitSurvival(); if (current === 'survival') rerender(); else navigate('survival'); });
onAction('orb-tap', () => {
  unlockAudio(); Orb.pulse();
  const tip = tapOrb(current || 'home');
  const msg = $('#orb-msg'); if (msg) msg.textContent = tip;
});
onAction('ask', () => { unlockAudio(); openAsk(current || 'home'); });
onAction('claim', (el) => {
  unlockAudio();
  const ch = DAILY_CHALLENGES.find((c) => c.id === el.dataset.id);
  if (claimChallenge(el.dataset.id)) { play('claim'); toast(`+${ch.xp} XP`, ch.title, 'xp'); }
  else { play('deny'); toast('Already claimed today'); }
});
onAction('notifications', () => {
  const list = Store.profile.notifications;
  openSheet(`<h2 class="h2">Notifications</h2>
    ${list.length ? `<ul class="notes">${list.map((n) => `<li class="glass ${n.read ? '' : 'unread'}"><b>${esc(n.title)}</b><span class="muted small">${esc(n.body)}</span><time class="muted small">${new Date(n.at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</time></li>`).join('')}</ul>
    <button class="btn sm ghost" data-act="notes-clear">Clear all</button>` : '<div class="empty glass">Nothing yet. Unlocks, achievements and challenges will appear here.</div>'}`,
  { cls: 'sheet-tall' });
  if (list.some((n) => !n.read)) Store.updateProfile((p) => p.notifications.forEach((n) => { n.read = true; }));
});
onAction('notes-clear', () => { Store.updateProfile((p) => { p.notifications = []; }); closeSheet(); toast('Notifications cleared'); });

window.addEventListener('hashchange', () => {
  const name = location.hash.replace('#/', '');
  if (SCREENS[name] && name !== current && Store.profile?.onboarded) navigate(name);
});

// ---------- progression feedback ----------
Store.addEventListener('change', rerender);
Store.addEventListener('progress', (e) => {
  const d = e.detail;
  if (d.type === 'levelup') {
    play('levelup');
    const parts = [];
    for (let lv = d.from + 1; lv <= d.to; lv++) {
      const u = LEVEL_UNLOCKS[lv] || {};
      (u.elements || []).forEach((x) => parts.push(`the ${x.toLowerCase()} element`));
      (u.features || []).forEach((x) => parts.push(`the ${x.toLowerCase()} section`));
      (u.species || []).forEach((x) => parts.push(`the ${x.toLowerCase()} species`));
    }
    toast(`LEVEL ${d.to}`, parts.length ? `Unlocked: ${parts.join(', ')}` : 'Your power grows.', 'level');
    if (!onboardingOpen) setTimeout(() => say(`You have reached level ${d.to}.${parts.length ? ` You have unlocked ${parts.join(', and ')}.` : ''}`), 600);
  } else if (d.type === 'achievement') {
    play('achievement'); toast(`Achievement: ${d.a.title}`, `+${d.a.xp} XP`, 'ach');
  } else if (d.type === 'challenge') {
    play('unlock'); toast('Challenge complete', `${d.ch.title} — claim it on HOME`, 'xp');
  }
});

// ---------- settings effects ----------
function applySettings() {
  const s = Store.settings, b = document.body;
  b.classList.toggle('reduce-motion', !!s.reduceMotion);
  b.classList.toggle('high-contrast', !!s.highContrast);
  b.classList.toggle('large-text', !!s.largeText);
  b.dataset.subs = s.subtitleSize;
  document.documentElement.style.setProperty('--ui-scale', (s.uiScale || 100) / 100);
  document.documentElement.style.setProperty('--btn-scale', (s.buttonSize || 100) / 100);
  Orb.setOptions({ quality: s.graphics, fps: s.fps, reduceMotion: s.reduceMotion });
  applyVolumes();
}
Store.addEventListener('settings', (e) => {
  applySettings();
  if (e.detail?.key === 'voiceEnabled' && !e.detail.value) stopSpeaking();
});

// ---------- account lifecycle ----------
function runOnboarding() {
  onboardingOpen = true;
  document.body.classList.add('onboarding');
  startOnboarding(() => {
    onboardingOpen = false;
    document.body.classList.remove('onboarding');
    show('home', { anim: false });
    history.replaceState(null, '', '#/home');
    setTimeout(() => say(`This is HOME, ${Store.profile.username}. Tap me whenever you need guidance.`), 500);
  });
}
Store.addEventListener('account', () => {
  closeSheet(true); stopSpeaking();
  $('#screens').innerHTML = ''; current = null;
  if (!Store.profile || !Store.profile.onboarded) runOnboarding();
  else { rolloverIfNeeded(); show('home', { anim: false }); }
});

// ---------- boot ----------
async function boot() {
  await Store.init();
  applySettings();
  embers = startEmbers($('#embers'));
  startGamepadNav();
  await Drawing.loadLibrary();
  // first gesture anywhere unlocks audio (iOS requirement)
  window.addEventListener('pointerdown', () => unlockAudio(), { once: true, capture: true });
  if (!Store.profile || !Store.profile.onboarded) runOnboarding();
  else {
    Store.updateProfile((p) => { p.stats.sessions += 1; p.lastActive = Date.now(); });
    rolloverIfNeeded();
    checkAchievements();
    const start = location.hash.replace('#/', '');
    show(SCREENS[start] && start !== 'settings' ? start : 'home', { anim: false, restore: true });
  }
  setInterval(() => { if (rolloverIfNeeded() || current === 'home') rerender(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) rolloverIfNeeded(); });
  document.body.classList.add('ready');
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
}
boot();
window.__DA = { Store, show, navigate }; // test hook
