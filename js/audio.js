// WebAudio sound system: master / music / sfx / voice buses (spec §18).
// All sounds are synthesized in code (original, no licensed assets needed).
import { Store } from './store.js';

let ctx = null, master, music, sfx, voice, musicNodes = null, humNodes = null, noiseBuf = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    music = ctx.createGain(); music.connect(master);
    sfx = ctx.createGain(); sfx.connect(master);
    voice = ctx.createGain(); voice.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes();
    startMusic();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function applyVolumes() {
  if (!ctx) return;
  const s = Store.settings, t = ctx.currentTime;
  master.gain.setTargetAtTime(s.masterVolume, t, 0.05);
  music.gain.setTargetAtTime(s.musicVolume * 0.5, t, 0.2);
  sfx.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
  voice.gain.setTargetAtTime(s.voiceVolume, t, 0.05);
}

function env(g, t, a, peak, dcy) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
}
function tone(freq, { type = 'sine', at = 0, a = 0.005, d = 0.18, peak = 0.25, slide = 0, bus = sfx } = {}) {
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + a + d);
  env(g, t, a, peak, d);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + a + d + 0.05);
}
function whoosh({ at = 0, d = 0.28, from = 400, to = 2400, peak = 0.12 } = {}) {
  const t = ctx.currentTime + at;
  const n = ctx.createBufferSource(); n.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + d);
  const g = ctx.createGain(); env(g, t, d * 0.4, peak, d * 0.6);
  n.connect(f); f.connect(g); g.connect(sfx); n.start(t); n.stop(t + d + 0.05);
}

export function play(name) {
  if (!ctx || ctx.state !== 'running') return;
  switch (name) {
    case 'tap': tone(880, { d: 0.07, peak: 0.12, type: 'triangle', slide: 0.7 }); break;
    case 'nav': whoosh({ d: 0.22, from: 300, to: 1800 }); tone(220, { d: 0.2, peak: 0.08, slide: 1.5 }); break;
    case 'open': whoosh({ d: 0.35, from: 200, to: 900, peak: 0.1 }); break;
    case 'toggle': tone(660, { d: 0.05, peak: 0.1, type: 'square', slide: 1.2 }); break;
    case 'deny': tone(140, { d: 0.25, peak: 0.18, type: 'sawtooth', slide: 0.8 }); break;
    case 'claim': [523, 659, 784, 1046].forEach((f, i) => tone(f, { at: i * 0.07, d: 0.3, peak: 0.14, type: 'triangle' })); break;
    case 'unlock': whoosh({ d: 0.6, from: 150, to: 3000, peak: 0.1 }); [392, 523, 784].forEach((f, i) => tone(f, { at: 0.1 + i * 0.12, d: 0.6, peak: 0.12 })); break;
    case 'achievement': [440, 554, 659, 880, 1108].forEach((f, i) => tone(f, { at: i * 0.09, d: 0.45, peak: 0.12, type: 'triangle' })); break;
    case 'levelup': whoosh({ d: 0.9, from: 120, to: 4000, peak: 0.12 }); [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, { at: i * 0.08, d: 0.7, peak: 0.1, type: 'sawtooth' })); break;
    case 'orb': tone(110, { d: 0.8, peak: 0.12, slide: 1.01 }); tone(165, { d: 0.8, peak: 0.06, at: 0.02 }); break;
  }
}

// Ambient cosmic music bed: slow detuned pad with filter drift.
function startMusic() {
  if (musicNodes || !ctx) return;
  const out = ctx.createGain(); out.gain.value = 0.18;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 4;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
  const lfoG = ctx.createGain(); lfoG.gain.value = 380; lfo.connect(lfoG); lfoG.connect(f.frequency);
  const oscs = [55, 82.4, 110.2, 164.8, 220.6].map((fr, i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = fr;
    o.detune.value = (i - 2) * 6; const g = ctx.createGain(); g.gain.value = i < 2 ? 0.5 : 0.18;
    o.connect(g); g.connect(f); o.start(); return o;
  });
  f.connect(out); out.connect(music); lfo.start();
  musicNodes = { oscs, lfo, out };
}

// Soft cosmic hum that underlays ORB's speech (voice bus).
export function setHum(on) {
  if (!ctx) return;
  if (!humNodes) {
    const g = ctx.createGain(); g.gain.value = 0;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const o1 = ctx.createOscillator(); o1.frequency.value = 49;
    const o2 = ctx.createOscillator(); o2.frequency.value = 73.6; o2.type = 'triangle';
    const trem = ctx.createOscillator(); trem.frequency.value = 0.35;
    const ts = ctx.createGain(); ts.gain.value = 0.7;
    const tg = ctx.createGain(); tg.gain.value = 0.3; trem.connect(tg); tg.connect(ts.gain);
    o1.connect(f); o2.connect(f); f.connect(ts); ts.connect(g); g.connect(voice);
    o1.start(); o2.start(); trem.start();
    humNodes = { g };
  }
  humNodes.g.gain.setTargetAtTime(on ? 0.07 : 0, ctx.currentTime, on ? 0.3 : 0.6);
}

export function audioReady() { return !!ctx && ctx.state === 'running'; }
Store.addEventListener('settings', applyVolumes);
