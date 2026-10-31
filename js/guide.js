// ORB guidance: contextual tips per screen + scripted help topics.
// The "Ask ORB" responder is keyword matching over written help topics; it is
// not an AI and is labeled as such in the UI.
import { TIPS, HELP_TOPICS } from './content.js';
import { say, stopSpeaking } from './voice.js';
import { recordOrbTalk } from './progression.js';
import { Orb } from './orb.js';
import { openSheet, onAction, esc, ICONS } from './ui.js';
import { play } from './audio.js';

const tipIndex = {};
let remount = () => {};
export function setRemount(fn) { remount = fn; }

export function nextTip(screen) {
  const list = TIPS[screen] || TIPS.home;
  const i = tipIndex[screen] ?? 0;
  tipIndex[screen] = (i + 1) % list.length;
  return list[i];
}

export function tapOrb(screen) {
  play('orb');
  const tip = nextTip(screen);
  say(tip);
  recordOrbTalk('tip');
  return tip;
}

export function answer(question) {
  const q = ' ' + question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ') + ' ';
  let best = null, bestScore = 0;
  for (const t of HELP_TOPICS) {
    let s = 0;
    for (const k of t.keys) if (q.includes(k.includes(' ') ? k : ' ' + k) || q.includes(' ' + k + 's ')) s += k.length > 4 ? 2 : 1;
    if (s > bestScore) { bestScore = s; best = t; }
  }
  return best ? { topic: best, text: best.answer } : { topic: null, text: 'I do not hold guidance on that yet. Choose one of my help topics below, and I will tell you what I know.' };
}

export function openAsk(screen) {
  const chips = HELP_TOPICS.map((t) => `<button class="chip" data-act="ask-topic" data-id="${t.id}">${esc(t.label)}</button>`).join('');
  openSheet(`
    <div class="ask-head"><div class="orb-slot orb-slot-sm" id="ask-orb"></div>
      <div><div class="eyebrow">ORB · THE ETERNAL GUIDE</div><h2 class="h2">Ask the guide</h2>
      <p class="muted small">Guide help topics — scripted answers, not an AI chat.</p></div></div>
    <div class="ask-answer glass-inner" id="ask-answer" aria-live="polite">${esc(nextTip(screen))}</div>
    <form class="ask-form" id="ask-form" autocomplete="off">
      <input id="ask-input" class="input" maxlength="120" placeholder="Type a question… e.g. how do I unlock CREATE?" aria-label="Ask ORB a question">
      <button class="icon-btn pink" type="submit" aria-label="Ask">${ICONS.send}</button>
    </form>
    <div class="chips">${chips}</div>`,
  {
    cls: 'sheet-tall',
    onMount: (el) => {
      Orb.mount(el.querySelector('#ask-orb'));
      el.querySelector('#ask-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = el.querySelector('#ask-input');
        const v = inp.value.trim(); if (!v) return;
        respond(answer(v).text); inp.value = ''; inp.blur();
      });
    },
    onClose: () => { stopSpeaking(); remount(); },
  });
}

function respond(text) {
  const box = document.getElementById('ask-answer');
  if (box) { box.textContent = text; box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash'); }
  play('orb');
  say(text);
  recordOrbTalk('question');
}

onAction('ask-topic', (el) => {
  const t = HELP_TOPICS.find((x) => x.id === el.dataset.id);
  if (t) respond(t.answer);
});
