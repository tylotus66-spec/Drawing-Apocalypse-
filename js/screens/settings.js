import { Store, DEFAULT_SETTINGS } from '../store.js';
import { levelInfo } from '../progression.js';
import { APP_VERSION, CURRENT_PHASE } from '../config.js';
import { esc, ICONS, onAction, toast, confirmDialog, avatarHTML, fileToAvatar } from '../ui.js';
import { play } from '../audio.js';
import { say, listVoices, pickVoice, voiceSupported } from '../voice.js';
import { sectionHeader } from './common.js';

const slider = (key, label, min, max, step, fmt = (v) => v) => {
  const v = Store.settings[key];
  return `<label class="set-row"><span>${label}</span><span class="set-ctl"><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-set="${key}" data-num="1"><output>${fmt(v)}</output></span></label>`;
};
const pct = (v) => Math.round(v * 100) + '%';
const toggle = (key, label, hint = '') => `<label class="set-row"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><input type="checkbox" class="switch" data-set="${key}" ${Store.settings[key] ? 'checked' : ''}></label>`;
const select = (key, label, opts, hint = '') => `<label class="set-row"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><select class="input sel" data-set="${key}" ${opts.some(([v]) => typeof v === 'number') ? 'data-num="1"' : ''}>${opts.map(([v, n]) => `<option value="${esc(v)}" ${String(Store.settings[key]) === String(v) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;

function padsHTML() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  return pads.length ? pads.map((g) => `<div class="tag ok">${esc(g.id.slice(0, 40))} · ${g.buttons.length} buttons</div>`).join('') : '<div class="muted small">No controller detected. Pair one in your phone’s Bluetooth settings, then press any button.</div>';
}

const SECTIONS = [['account', 'Account', 'user'], ['audio', 'Audio & ORB voice', 'voice'], ['display', 'Graphics & display', 'monitor'], ['controls', 'Controls', 'pad'], ['accessibility', 'Accessibility', 'eye'], ['notifications', 'Notifications', 'bell'], ['privacy', 'Privacy & data', 'lock']];
const si = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SIC = { user: si('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'), voice: ICONS.voice, monitor: si('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'), pad: si('<path d="M6 8h12a4 4 0 0 1 3.8 5.2l-1.2 3.6a2.2 2.2 0 0 1-3.8.6L15 15H9l-1.8 2.4a2.2 2.2 0 0 1-3.8-.6l-1.2-3.6A4 4 0 0 1 6 8Z"/><path d="M8 10v3M6.5 11.5h3M15.5 11h.01M17.5 12.5h.01"/>'), eye: si('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'), bell: ICONS.bell, lock: ICONS.lock };
let sec = null;
export function openSection(id) { sec = SECTIONS.some((x) => x[0] === id) ? id : null; }
export function sectionOpen() { return !!sec; }
export function closeSection() { sec = null; }
const uid = (p) => 'DA-' + p.id.replace('local-', '').slice(-8).toUpperCase();

export function render() {
  const p = Store.profile;
  const voices = voiceSupported() ? listVoices() : [];
  const auto = pickVoice();
  const secName = sec && SECTIONS.find((x) => x[0] === sec)?.[1];
  return `${sectionHeader(sec ? secName.toUpperCase() : 'SETTINGS', 'Saved on this device', { back: true })}
  ${sec ? '' : `<section class="set-profile glass">${avatarHTML(p, 76, 'sq')}<div class="grow"><b>${esc(p.username)}</b><div class="muted small">LEVEL ${levelInfo().level} · ${esc(p.title || 'Survivor')}</div><div class="muted small">UID: ${esc(uid(p))}</div></div><button class="btn sm ghost" data-act="set-open" data-id="account">Edit</button></section>
  <nav class="set-list">${SECTIONS.map(([id, n, ic]) => `<button class="set-li glass" data-act="set-open" data-id="${id}"><span class="set-ic">${SIC[ic]}</span><b class="grow">${n}</b><span class="chev">${ICONS.back}</span></button>`).join('')}</nav>`}
  <div class="set-body" ${sec ? `data-sec="${sec}"` : 'hidden'}>

  <section class="card glass" id="set-account"><h3>Account</h3>
    <div class="row gap">${avatarHTML(p, 64)}<div class="grow"><b>${esc(p.username)}</b><div class="muted small">Local profile · ${esc(p.id)}</div></div></div>
    <div class="row gap wrap"><label class="btn sm ghost file-btn">${ICONS.upload} Profile image<input type="file" accept="image/*" id="avatar-file" hidden></label>${p.avatar ? '<button class="btn sm ghost" data-act="avatar-clear">Use sigil</button>' : ''}</div>
    <form class="row gap" id="name-form"><input class="input grow" id="name-input" maxlength="16" value="${esc(p.username)}" aria-label="Username"><button class="btn sm pink" type="submit">Save name</button></form>
    <div class="note">${Store.tampered ? '⚠ The local save was modified outside the app. Progress shown is recomputed from the reward ledger.' : 'Cloud account, login and cross-device saves need a server. They are planned for a later phase; your progress stays on this phone until then.'}</div>
    <div class="row gap wrap"><button class="btn sm ghost" data-act="export-save">${ICONS.download} Export backup</button><label class="btn sm ghost file-btn">${ICONS.upload} Import backup<input type="file" accept="application/json,.json" id="import-file" hidden></label></div>
  </section>

  <section class="card glass" id="set-audio"><h3>Audio & ORB voice</h3>
    ${slider('masterVolume', 'Master volume', 0, 1, 0.05, pct)}
    ${slider('musicVolume', 'Music', 0, 1, 0.05, pct)}
    ${slider('sfxVolume', 'Sound effects', 0, 1, 0.05, pct)}
    ${toggle('voiceEnabled', 'ORB voice narration', voiceSupported() ? '' : 'Speech not supported on this browser — subtitles only')}
    ${slider('voiceVolume', 'ORB voice volume', 0, 1, 0.05, pct)}
    ${voices.length ? select('voiceURI', 'ORB voice', [['', `Auto — deepest (${auto ? auto.name : 'default'})`], ...voices.map((v) => [v.voiceURI, v.name])]) : ''}
    <div class="row"><button class="btn sm ghost" data-act="test-voice">Test ORB voice</button></div>
    ${toggle('subtitles', 'Subtitles', 'Shown whenever ORB speaks. Always on if voice is off.')}
    ${select('subtitleSize', 'Subtitle size', [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']])}
  </section>

  <section class="card glass" id="set-display"><h3>Language & display</h3>
    ${select('language', 'Language', [['en', 'English']], 'More languages after launch')}
    ${select('graphics', 'Graphics quality', [['low', 'Low (battery saver)'], ['medium', 'Medium'], ['high', 'High']])}
    ${select('fps', 'Frame rate', [[30, '30 FPS (battery saver)'], [60, '60 FPS']])}
    ${slider('uiScale', 'Interface scale', 85, 125, 5, (v) => v + '%')}
  </section>

  <section class="card glass" id="set-controls"><h3>Controls</h3>
    <div class="muted small">Applied by the Survival game (Phase 3). Saved now.</div>
    ${slider('cameraSensitivity', 'Camera sensitivity', 1, 100, 1)}
    ${slider('aimSensitivity', 'Aim sensitivity', 1, 100, 1)}
    ${select('controlLayout', 'Control layout', [['standard', 'Standard (move left, look right)'], ['lefty', 'Left-handed (mirrored)'], ['compact', 'Compact']])}
    ${slider('buttonSize', 'Button size', 70, 140, 5, (v) => v + '%')}
    ${toggle('vibration', 'Vibration', navigator.vibrate ? 'Haptic taps' : 'Not supported by this browser (iPhone Safari blocks web vibration)')}
    ${toggle('controllerVibration', 'Controller rumble')}
    <h4 class="label">Controller</h4><div id="pads">${padsHTML()}</div>
    <table class="map"><tr><th>Action</th><th>Default</th></tr>${[['Move', 'Left stick'], ['Camera', 'Right stick'], ['Aim', 'LT / L2'], ['Fire', 'RT / R2'], ['Reload', 'X / ■'], ['Jump', 'A / ✕'], ['Crouch', 'B / ●'], ['Melee', 'R3'], ['Switch weapon', 'Y / ▲'], ['Element', 'LB / RB'], ['Menu', 'Start']].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>
    <div class="muted small">Custom remapping arrives with the Survival controls.</div>
  </section>

  <section class="card glass" id="set-accessibility"><h3>Accessibility</h3>
    ${toggle('reduceMotion', 'Reduce motion', 'Slower ORB, fewer particles, no slide transitions')}
    ${toggle('highContrast', 'High contrast')}
    ${toggle('largeText', 'Larger text')}
  </section>

  <section class="card glass" id="set-notifications"><h3>Notifications</h3>
    ${toggle('notifyAchievements', 'Achievements')}
    ${toggle('notifyChallenges', 'Challenges')}
    ${toggle('notifyUnlocks', 'Unlocks & level ups')}
    <div class="muted small">These are in-app notifications. Push notifications to your lock screen need a server (later phase).</div>
  </section>

  <section class="card glass" id="set-privacy"><h3>Privacy & data</h3>
    <p class="muted small">This build sends nothing anywhere: no analytics, no tracking, no account server. Your profile, progress and settings are stored only in this browser on this phone.</p>
    <div class="row gap wrap"><button class="btn sm ghost" data-act="reset-settings">Reset settings</button><button class="btn sm danger" data-act="delete-profile">Delete profile & progress</button></div>
  </section>
  </div>
  <p class="foot muted small">DRAWING APOCALYPSE ${APP_VERSION} · Phase ${CURRENT_PHASE}</p>`;
}

export function bind(root) {
  root.querySelectorAll('[data-set]').forEach((inp) => {
    const ev = inp.type === 'range' ? 'input' : 'change';
    inp.addEventListener(ev, () => {
      const key = inp.dataset.set;
      let val = inp.type === 'checkbox' ? inp.checked : inp.value;
      if (inp.dataset.num) val = Number(val);
      Store.setSetting(key, val);
      const out = inp.parentElement.querySelector('output');
      if (out) out.textContent = /Volume$/.test(key) ? Math.round(val * 100) + '%' : (key === 'uiScale' || key === 'buttonSize') ? val + '%' : val;
      if (inp.type !== 'range') play('toggle');
    });
    if (inp.type === 'range') inp.addEventListener('change', () => play('tap'));
  });
  root.querySelector('#name-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = root.querySelector('#name-input').value.trim();
    if (!/^[\w\- ]{3,16}$/.test(v)) { play('deny'); toast('Name must be 3–16 letters, numbers, spaces, - or _'); return; }
    Store.updateProfile((p) => { p.username = v; }); play('claim'); toast('Name saved');
  });
  root.querySelector('#avatar-file')?.addEventListener('change', async (e) => {
    try { const url = await fileToAvatar(e.target.files[0]); Store.updateProfile((p) => { p.avatar = url; }); play('claim'); toast('Profile image updated'); }
    catch (err) { play('deny'); toast(err.message); }
  });
  root.querySelector('#import-file')?.addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { await Store.importSave(await f.text()); play('unlock'); toast('Backup restored'); }
    catch (err) { play('deny'); toast('Import failed', err.message); }
  });
}

onAction('set-open', (el) => { openSection(el.dataset.id); play('nav'); document.dispatchEvent(new Event('rerender')); setTimeout(() => document.querySelector('.screen.active .screen-scroll')?.scrollTo(0, 0), 30); });
onAction('avatar-clear', () => { Store.updateProfile((p) => { p.avatar = null; }); play('tap'); });
onAction('test-voice', () => say('I am ORB, the Eternal Guide. This is how I sound.'));
onAction('export-save', () => {
  const blob = new Blob([Store.exportSave()], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `drawing-apocalypse-${Store.profile.username}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup exported', 'Keep the file somewhere safe (Files app).');
});
onAction('reset-settings', async () => {
  if (!(await confirmDialog('Reset settings?', 'Audio, display, controls and accessibility go back to defaults. Progress is not affected.', 'Reset'))) return;
  Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => Store.setSetting(k, v));
  document.dispatchEvent(new Event('rerender')); toast('Settings reset');
});
onAction('delete-profile', async () => {
  if (!(await confirmDialog('Delete profile?', 'This erases your profile, level, achievements and challenges from this phone. This cannot be undone. Export a backup first if you want to keep it.', 'Delete'))) return;
  await Store.deleteAccount();
});
window.addEventListener('gamepadconnected', () => { const el = document.getElementById('pads'); if (el) el.innerHTML = padsHTML(); });
window.addEventListener('gamepaddisconnected', () => { const el = document.getElementById('pads'); if (el) el.innerHTML = padsHTML(); });
