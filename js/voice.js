// ORB voice: Web Speech API (on-device voices) with a deep, slow delivery,
// natural pauses between sentences, a WebAudio cosmic hum underlay, and
// subtitles that always carry the words (spec §5, §18).
// Note: browsers do not allow routing speechSynthesis output through WebAudio,
// so true reverb on the voice is not possible in a web app (see PROGRESS.md).
import { Store } from './store.js';
import { Orb } from './orb.js';
import { setHum } from './audio.js';

const synth = window.speechSynthesis || null;
let voices = [];
let queueId = 0;
let speaking = false;
const subEl = () => document.getElementById('subtitles');

const DEEP_HINTS = [
  /daniel/i, /arthur/i, /aaron/i, /fred/i, /ralph/i, /rocko/i, /grandpa/i, /reed/i, /eddy/i, /alex\b/i, /oliver/i,
  /gordon/i, /tom\b/i, /evan/i, /nathan/i, /guy/i, /david/i, /mark/i, /james/i, /george/i, /ryan/i, /thomas/i,
  /male/i, /man\b/i, /uk english male/i,
];
const AVOID = [/female/i, /samantha/i, /victoria/i, /karen/i, /moira/i, /tessa/i, /fiona/i, /zira/i, /susan/i, /hazel/i, /kathy/i, /princess/i, /bells/i, /bubbles/i, /whisper/i, /superstar/i, /jester/i];

function loadVoices() { if (synth) voices = synth.getVoices().filter((v) => /^en/i.test(v.lang)); }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

export function listVoices() { loadVoices(); return voices; }
export function voiceSupported() { return !!synth; }

/** Choose the deepest-sounding available English voice (heuristic by name). */
export function pickVoice() {
  loadVoices();
  const chosen = Store.settings.voiceURI && voices.find((v) => v.voiceURI === Store.settings.voiceURI);
  if (chosen) return chosen;
  let best = null, bestScore = -1e9;
  for (const v of voices) {
    let s = 0;
    DEEP_HINTS.forEach((re, i) => { if (re.test(v.name)) s += 40 - i; });
    if (AVOID.some((re) => re.test(v.name))) s -= 100;
    if (v.localService) s += 5;
    if (/en[-_](GB|US)/i.test(v.lang)) s += 3;
    if (s > bestScore) { bestScore = s; best = v; }
  }
  return best;
}

function showSub(text) {
  const el = subEl(); if (!el) return;
  el.querySelector('.sub-text').textContent = text;
  el.classList.add('show');
}
function hideSub() { subEl()?.classList.remove('show'); }

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [text];
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function setSpeaking(on) {
  speaking = on;
  Orb.setSpeaking(on);
  setHum(on && Store.settings.voiceEnabled);
  document.body.classList.toggle('orb-speaking', on);
}

function speakOne(sentence, myId) {
  return new Promise((resolve) => {
    const s = Store.settings;
    if (!synth || !s.voiceEnabled || s.masterVolume * s.voiceVolume <= 0) {
      // No audio: keep the sentence on screen for a natural reading time.
      setTimeout(resolve, Math.max(1600, sentence.length * 62));
      return;
    }
    const u = new SpeechSynthesisUtterance(sentence);
    const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
    u.pitch = 0.55; u.rate = 0.82; u.volume = Math.min(1, s.masterVolume * s.voiceVolume);
    let done = false;
    const fin = () => { if (!done) { done = true; clearTimeout(guard); resolve(); } };
    u.onend = fin; u.onerror = fin;
    const guard = setTimeout(fin, 2500 + sentence.length * 120); // some engines never fire onend
    if (myId !== queueId) return fin();
    synth.speak(u);
  });
}

/** Speak text as ORB. Returns when finished or interrupted. */
export async function say(text, { subtitle = true } = {}) {
  const myId = ++queueId;
  if (synth) synth.cancel();
  setSpeaking(true);
  Orb.pulse();
  const parts = splitSentences(text);
  for (let i = 0; i < parts.length; i++) {
    if (myId !== queueId) return;
    const show = subtitle && (Store.settings.subtitles || !Store.settings.voiceEnabled);
    if (show) showSub(parts[i]); else hideSub();
    await speakOne(parts[i], myId);
    if (myId !== queueId) return;
    await sleep(i < parts.length - 1 ? 280 : 120); // natural pauses
  }
  if (myId === queueId) { setSpeaking(false); setTimeout(() => { if (!speaking) hideSub(); }, 900); }
}

export function stopSpeaking() {
  queueId++;
  if (synth) synth.cancel();
  setSpeaking(false);
  hideSub();
}
export function isSpeaking() { return speaking; }
