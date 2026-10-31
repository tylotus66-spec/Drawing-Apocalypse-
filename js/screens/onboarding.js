// First-time ORB awakening: name the player, explain the five sections,
// then pay the one-time onboarding reward through the progression ledger.
import { Store } from '../store.js';
import { SECTIONS } from '../content.js';
import { completeOnboarding } from '../progression.js';
import { REWARDS } from '../config.js';
import { Orb } from '../orb.js';
import { say, stopSpeaking } from '../voice.js';
import { unlockAudio, play } from '../audio.js';
import { esc, ICONS, toast, fileToAvatar } from '../ui.js';

const ORDER = ['home', 'drawing', 'survival', 'create', 'vault'];
let step = 0, pendingAvatar = null, onDone = () => {};

function el() { return document.getElementById('onboarding'); }

export function startOnboarding(done) {
  onDone = done; step = 0; pendingAvatar = null;
  el().classList.add('open');
  draw();
}

function draw() {
  const root = el();
  const hasProfile = Store.hasAccount();
  let body = '';
  if (step === 0) {
    body = `<div class="ob-title"><img class="logo-full" src="./img/logo-orb.webp" alt="DRAWING APOCALYPSE" width="1000" height="801"><div class="tagline">DRAW. LEARN. EVOLVE. <span>SURVIVE.</span></div></div>
      <button class="btn pink big" data-ob="awaken">AWAKEN ORB</button>
      <div class="muted small">Sound on for ORB’s voice · subtitles always shown</div>`;
  } else if (step === 1) {
    body = `<div class="ob-card glass"><div class="eyebrow">ORB · THE ETERNAL GUIDE</div>
      <p class="ob-line">I am ORB, the Eternal Guide. I will walk beside you through the ruin. What should I call you?</p>
      <form id="ob-name" autocomplete="off"><input class="input big" id="ob-input" maxlength="16" placeholder="Your survivor name" aria-label="Username" autocapitalize="words">
      <div class="ob-av"><span id="ob-av-prev">${pendingAvatar ? `<img class="avatar" src="${pendingAvatar}" style="width:44px;height:44px">` : '<span class="avatar avatar-sigil" style="width:44px;height:44px">?</span>'}</span>
      <label class="btn sm ghost file-btn">${ICONS.upload} Profile image (optional)<input type="file" accept="image/*" id="ob-file" hidden></label></div>
      <button class="btn pink big" type="submit">Continue</button><div class="ob-err" id="ob-err"></div></form></div>`;
  } else if (step >= 2 && step <= 6) {
    const id = ORDER[step - 2], s = SECTIONS[id];
    body = `<div class="ob-card glass"><div class="ob-dots">${ORDER.map((_, i) => `<i class="${i <= step - 2 ? 'on' : ''}"></i>`).join('')}</div>
      <div class="ob-sec"><span class="ob-ic">${ICONS[id]}</span><h2 class="h2">${s.name}</h2></div>
      <p class="ob-line">${esc(s.line)}</p>
      <div class="row gap"><button class="btn ghost" data-ob="replay">Hear again</button><button class="btn pink grow" data-ob="next">${step === 6 ? 'Finish' : 'Next'}</button></div></div>`;
  } else {
    body = `<div class="ob-card glass"><div class="eyebrow">AWAKENING COMPLETE</div><h2 class="h2">Welcome, ${esc(Store.profile.username)}</h2>
      <p class="ob-line">Your journey begins. Complete daily challenges to grow stronger. At level five, the creator awakens.</p>
      <div class="xp-burst">+${REWARDS.onboarding.xp} XP</div><button class="btn pink big" data-ob="enter">Enter HOME</button></div>`;
  }
  root.innerHTML = `<div class="ob-bg"></div><div class="ob-inner">${step === 0 ? '' : '<div class="orb-slot orb-slot-ob" id="ob-orb"></div>'}${body}</div>`;
  if (step !== 0) Orb.mount(root.querySelector('#ob-orb'));
  if (step === 1) {
    if (hasProfile) { step = 2; return draw(); }
    const form = root.querySelector('#ob-name');
    setTimeout(() => root.querySelector('#ob-input')?.focus({ preventScroll: true }), 300);
    root.querySelector('#ob-file').addEventListener('change', async (e) => {
      try { pendingAvatar = await fileToAvatar(e.target.files[0]); root.querySelector('#ob-av-prev').innerHTML = `<img class="avatar" src="${pendingAvatar}" style="width:44px;height:44px">`; }
      catch (err) { toast(err.message); }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = root.querySelector('#ob-input').value.trim();
      if (!/^[\w\- ]{3,16}$/.test(v)) { play('deny'); root.querySelector('#ob-err').textContent = 'Use 3–16 letters, numbers, spaces, - or _'; return; }
      await Store.createAccount(v);
      if (pendingAvatar) Store.updateProfile((p) => { p.avatar = pendingAvatar; });
      play('claim'); step = 2; draw(); speakStep();
    });
  }
}

function speakStep() {
  if (step === 1) say('I am ORB, the Eternal Guide. I will walk beside you through the ruin. What should I call you?');
  else if (step >= 2 && step <= 6) {
    const s = SECTIONS[ORDER[step - 2]];
    say((step === 2 ? `Welcome, ${Store.profile.username}. There are five sections. ` : '') + s.line);
  } else if (step === 7) say(`Your journey begins, ${Store.profile.username}. Complete daily challenges to grow stronger. At level five, the creator awakens.`);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ob]'); if (!b) return;
  const a = b.dataset.ob;
  if (a === 'awaken') { unlockAudio(); play('unlock'); Orb.pulse(); step = 1; draw(); speakStep(); }
  else if (a === 'replay') { speakStep(); }
  else if (a === 'next') {
    play('nav'); step++;
    if (step === 7) { completeOnboarding(); play('levelup'); }
    draw(); speakStep();
  } else if (a === 'enter') {
    stopSpeaking(); play('nav'); el().classList.remove('open'); el().innerHTML = ''; onDone();
  }
});
