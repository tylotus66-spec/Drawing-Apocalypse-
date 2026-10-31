// Lesson media player: a real HTML5 <video> with custom controls (play/pause,
// seek, volume, captions, speed, fullscreen, step jumps, resume). It is only
// created when a lesson actually has video sources — never simulated.
import { esc } from './ui.js';

const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const PI = {
  play: sv('<path d="M7 4.5v15l12-7.5Z" fill="currentColor"/>'),
  pause: sv('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/>'),
  prev: sv('<path d="M6 5v14M18 5 9 12l9 7Z"/>'),
  next: sv('<path d="M18 5v14M6 5l9 7-9 7Z"/>'),
  vol: sv('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  mute: sv('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>'),
  cc: sv('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M10.5 10.5a2 2 0 1 0 0 3M16.5 10.5a2 2 0 1 0 0 3"/>'),
  full: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
};
export const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function playerHTML(t, prefs) {
  const src = (t.video || []).map((v) => `<source src="${esc(v.src)}" type="${esc(v.type)}">`).join('');
  const tracks = (t.captions || []).map((c, i) => `<track kind="captions" src="${esc(c.src)}" srclang="${esc(c.srclang)}" label="${esc(c.label)}" ${i === 0 ? 'default' : ''}>`).join('');
  return `<div class="player" data-id="${esc(t.id)}">
    <div class="pl-stage"><video class="pl-video" playsinline webkit-playsinline preload="metadata" ${t.poster ? `poster="${esc(t.poster)}"` : ''}>${src}${tracks}</video>
      <button class="pl-big" data-pl="toggle" aria-label="Play">${PI.play}</button>
      <div class="pl-msg" hidden></div></div>
    <div class="pl-bar">
      <input class="pl-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek">
      <div class="pl-row">
        <button class="pl-btn" data-pl="prev" aria-label="Previous step">${PI.prev}</button>
        <button class="pl-btn pl-pp" data-pl="toggle" aria-label="Play">${PI.play}</button>
        <button class="pl-btn" data-pl="next" aria-label="Next step">${PI.next}</button>
        <span class="pl-time"><span class="pl-cur">0:00</span> / <span class="pl-dur">--:--</span></span>
        <span class="grow"></span>
        <button class="pl-btn pl-mute" data-pl="mute" aria-label="Mute">${PI.vol}</button>
        <input class="pl-vol" type="range" min="0" max="1" step="0.05" value="${prefs.volume ?? 1}" aria-label="Volume">
        <button class="pl-btn pl-cc ${prefs.captions !== false && tracks ? 'on' : ''}" data-pl="cc" aria-label="Captions" ${tracks ? '' : 'disabled'}>${PI.cc}</button>
        <select class="pl-rate" aria-label="Speed">${[0.5, 0.75, 1, 1.25, 1.5].map((r) => `<option value="${r}" ${r === (prefs.rate || 1) ? 'selected' : ''}>${r}×</option>`).join('')}</select>
        <button class="pl-btn" data-pl="full" aria-label="Fullscreen">${PI.full}</button>
      </div></div></div>`;
}

/**
 * Wire a player element. hooks: { stepTimes, startAt, onTime(t, dur), onStep(i), onEnded(), onPrefs(p), onError(msg), getStep() }
 */
export function bindPlayer(root, hooks) {
  if (root._bound) return root._api;
  root._bound = true;
  const v = root.querySelector('video');
  const $ = (s) => root.querySelector(s);
  const seek = $('.pl-seek'), cur = $('.pl-cur'), dur = $('.pl-dur'), vol = $('.pl-vol');
  const times = hooks.stepTimes || [];
  let dragging = false, resumed = false;
  const setIcon = () => { const ic = v.paused ? PI.play : PI.pause; root.querySelectorAll('[data-pl=toggle]').forEach((b) => { b.innerHTML = ic; b.setAttribute('aria-label', v.paused ? 'Play' : 'Pause'); }); root.classList.toggle('playing', !v.paused); };
  const applyCC = () => { const on = $('.pl-cc').classList.contains('on'); [...v.textTracks].forEach((tr, i) => { tr.mode = on && i === 0 ? 'showing' : 'hidden'; }); };
  const stepAt = (t) => { let i = 0; times.forEach((s, k) => { if (t >= s) i = k; }); return i; };
  const msg = (text) => { const m = $('.pl-msg'); m.hidden = !text; m.textContent = text || ''; };
  v.volume = +vol.value; v.playbackRate = +$('.pl-rate').value;
  v.addEventListener('loadedmetadata', () => {
    dur.textContent = fmt(v.duration); applyCC();
    if (!resumed && hooks.startAt > 1 && hooks.startAt < v.duration - 2) { v.currentTime = hooks.startAt; }
    resumed = true;
  });
  v.addEventListener('timeupdate', () => {
    if (!dragging && v.duration) seek.value = Math.round((v.currentTime / v.duration) * 1000);
    cur.textContent = fmt(v.currentTime);
    hooks.onTime?.(v.currentTime, v.duration);
    if (times.length) { const i = stepAt(v.currentTime); if (i !== hooks.getStep?.()) hooks.onStep?.(i, 'video'); }
  });
  v.addEventListener('play', setIcon); v.addEventListener('pause', () => { setIcon(); hooks.onTime?.(v.currentTime, v.duration, true); });
  v.addEventListener('ended', () => { setIcon(); hooks.onEnded?.(); });
  v.addEventListener('error', () => msg('This video could not be loaded. Check your connection or the file path in tutorials.json.'), true);
  root.querySelector('source:last-of-type')?.addEventListener('error', () => msg('This video could not be loaded. Check your connection or the file path in tutorials.json.'));
  seek.addEventListener('input', () => { dragging = true; if (v.duration) cur.textContent = fmt((seek.value / 1000) * v.duration); });
  seek.addEventListener('change', () => { dragging = false; if (v.duration) v.currentTime = (seek.value / 1000) * v.duration; });
  vol.addEventListener('input', () => { v.volume = +vol.value; v.muted = v.volume === 0; $('.pl-mute').innerHTML = v.muted ? PI.mute : PI.vol; hooks.onPrefs?.({ volume: v.volume }); });
  $('.pl-rate').addEventListener('change', (e) => { v.playbackRate = +e.target.value; hooks.onPrefs?.({ rate: v.playbackRate }); });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pl]'); if (!b || b.disabled) return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.pl;
    if (a === 'toggle') { if (v.paused) v.play().catch(() => msg('Tap play again to start the video.')); else v.pause(); }
    if (a === 'prev' || a === 'next') api.gotoStep((hooks.getStep?.() ?? stepAt(v.currentTime)) + (a === 'next' ? 1 : -1));
    if (a === 'mute') { v.muted = !v.muted; b.innerHTML = v.muted ? PI.mute : PI.vol; }
    if (a === 'cc') { b.classList.toggle('on'); applyCC(); hooks.onPrefs?.({ captions: b.classList.contains('on') }); }
    if (a === 'full') {
      const st = root;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (st.requestFullscreen) st.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
      else v.webkitEnterFullscreen?.(); // iPhone Safari: native fullscreen video
    }
  });
  const api = {
    video: v,
    gotoStep(i) { if (!times.length) return; i = Math.max(0, Math.min(times.length - 1, i)); v.currentTime = times[i] + 0.05; hooks.onStep?.(i, 'jump'); },
    pause() { v.pause(); },
  };
  root._api = api;
  return api;
}
