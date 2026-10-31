// DRAWING — video tutorial library (design sheet screen 5). No drawing canvas:
// players learn by watching. Lessons come from content/tutorials.json.
import { Store } from '../store.js';
import { DRAW_CATEGORIES, DIFFICULTIES } from '../content.js';
import { esc, ICONS, onAction, toast } from '../ui.js';
import { play } from '../audio.js';
import { say, stopSpeaking } from '../voice.js';
import { completeLesson, LESSON_XP } from '../progression.js';
import { playerHTML, bindPlayer, fmt } from '../player.js';
import { sectionHeader } from './common.js';

let library = null;
let loadError = null;
const ui = { cat: null, tut: null, q: '', diff: '', fav: false };
const DWELL_MS = 4000;       // a step counts as studied after 4 s on screen (or when the video plays through it)
let dwellTimer = null, playerCache = null, lastSave = 0;

export async function loadLibrary() {
  try {
    const r = await fetch('./content/tutorials.json', { cache: 'no-cache' });
    library = (await r.json()).tutorials || [];
  } catch (e) { loadError = e; library = []; }
}
export const getLibrary = () => library || [];
const byId = (id) => library?.find((x) => x.id === id);
const catName = (id) => DRAW_CATEGORIES.find((c) => c.id === id)?.name || id;
const rec = (id) => Store.profile.tutorials?.[id] || null;
const isFav = (id) => Store.profile.bookmarks.includes(id);

export function openTutorial(id) { const t = byId(id); if (t) { ui.cat = t.category; ui.tut = t.id; } }
export function drawingContext() {
  const t = ui.tut && byId(ui.tut);
  if (t) { const r = rec(t.id); return { tut: t.id, label: `${t.title} · ${r?.completedAt ? 'completed' : `step ${(r?.step || 0) + 1} of ${t.steps.length}`}` }; }
  return { label: ui.cat ? `${catName(ui.cat)} lessons` : 'Tutorial library' };
}
export function resetDrawingView() { leaveDrawing(); ui.cat = null; ui.tut = null; }
export function drawingDepth() { return ui.tut ? 2 : ui.cat ? 1 : 0; }
export function drawingBack() { if (ui.tut) { leaveLesson(); ui.tut = null; } else ui.cat = null; }
export function leaveDrawing() { leaveLesson(); }
function leaveLesson() {
  clearTimeout(dwellTimer); dwellKey = '';
  if (playerCache) { savePos(playerCache.api.video.currentTime, true); playerCache.api.pause(); playerCache = null; }
  stopSpeaking();
}

// ---------- progress ----------
function ensureRec(id) {
  Store.updateProfile((p) => { p.tutorials ||= {}; p.tutorials[id] ||= { step: 0, seen: [], pos: 0, startedAt: Date.now() }; p.tutorials[id].updatedAt = Date.now(); }, { silent: true });
  return rec(id);
}
function setStep(t, i, { from = 'ui' } = {}) {
  i = Math.max(0, Math.min(t.steps.length - 1, i));
  Store.updateProfile((p) => { const r = p.tutorials[t.id]; r.step = i; r.updatedAt = Date.now(); }, { silent: true });
  armDwell(t);
  if (from !== 'video' && playerCache && t.stepTimes) playerCache.api.gotoStep(i);
  document.dispatchEvent(new Event('activity'));
  paintStep(t);
}
function markSeen(t, i) {
  const r = rec(t.id); if (!r || r.seen.includes(i)) return;
  Store.updateProfile((p) => { p.tutorials[t.id].seen.push(i); }, { silent: true });
  paintStep(t);
}
let dwellKey = '';
function armDwell(t) {
  const i = rec(t.id).step; const key = `${t.id}:${i}`;
  if (key === dwellKey) return;           // re-renders must not restart the clock for the same step
  clearTimeout(dwellTimer); dwellKey = key;
  dwellTimer = setTimeout(() => { dwellKey = ''; if (ui.tut === t.id) markSeen(t, i); }, DWELL_MS);
}
function savePos(time, force) {
  const t = ui.tut && byId(ui.tut); if (!t || !rec(t.id)) return;
  if (!force && Date.now() - lastSave < 2000) return;
  lastSave = Date.now();
  Store.updateProfile((p) => { p.tutorials[t.id].pos = Math.round(time * 10) / 10; }, { silent: true });
}

// ---------- hub ----------
function badge(t) {
  const r = rec(t.id);
  if (r?.completedAt) return `<span class="tb tb-done">${ICONS.check} Done</span>`;
  if (r) return `<span class="tb">Step ${r.step + 1}/${t.steps.length}</span>`;
  return t.video ? `<span class="tb tb-vid">${t.videoKind === 'demo-animation' ? 'Demo animation' : 'Video'}</span>` : '<span class="tb tb-novid">Steps only</span>';
}
function card(t, featId) {
  const key = `${t.title} ${catName(t.category)} ${t.difficulty} ${t.summary || ''}`.toLowerCase();
  return `<button class="tcard" data-act="tut-open" data-id="${t.id}" data-key="${esc(key)}" data-diff="${t.difficulty}" data-fav="${isFav(t.id) ? 1 : 0}"${t.id === featId ? ' data-feat="1"' : ''}>
    <span class="tcard-img"><img src="${esc(t.thumbnail)}" alt="" loading="lazy">${isFav(t.id) ? `<span class="tfav">${ICONS.heart}</span>` : ''}${badge(t)}</span>
    <span class="tcard-t"><b>${esc(t.title)}</b><small>${esc(t.difficulty)} · ${t.steps.length} steps</small></span></button>`;
}
function featured(list) {
  const t = (!ui.cat || ui.cat === 'dragons') ? list.find((x) => x.featured) || list[0] : list[0];
  if (!t) return '';
  const r = rec(t.id); const ref = t.reference || t.thumbnail;
  return `<button class="feat" data-act="tut-open" data-id="${t.id}">
    <img src="${esc(ref)}" alt="${esc(t.title)} reference${t.referenceStep ? `, step ${t.referenceStep} of ${t.steps.length}` : ''}">
    <span class="feat-play">${ICONS.play}</span>
    <span class="feat-txt"><small>${t.featured ? 'FEATURED · HOW TO DRAW' : 'HOW TO DRAW'}</small><b>${esc(t.title)}</b>
      <em>${t.steps.length} steps · ${esc(t.difficulty)}${t.referenceStep ? ` · reference at step ${t.referenceStep} of ${t.steps.length}` : ''}</em></span>
    <span class="feat-st">${r?.completedAt ? 'Completed' : r ? `Resume · step ${r.step + 1}` : t.video ? (t.videoKind === 'demo-animation' ? 'Demo animation' : 'Video lesson') : 'Video not uploaded yet'}</span></button>`;
}
function renderHub() {
  const all = library || [];
  const inCat = ui.cat ? all.filter((t) => t.category === ui.cat) : all;
  const feat = featured(inCat);
  const featId = feat ? feat.match(/data-id="([^"]+)"/)[1] : null;
  const rest = inCat;
  const done = all.filter((t) => rec(t.id)?.completedAt).length;
  return `${sectionHeader('DRAWING', `${all.length} lessons · ${done} completed`)}
  <div class="dr-tools">
    <label class="search glass">${ICONS.search}<input id="dr-q" type="search" placeholder="Search lessons" value="${esc(ui.q)}" aria-label="Search lessons" autocomplete="off"></label>
    <div class="chips dr-chips">
      <button class="chip ${!ui.diff ? 'on' : ''}" data-act="dr-diff" data-v="">All</button>
      ${DIFFICULTIES.map((d) => `<button class="chip ${ui.diff === d ? 'on' : ''}" data-act="dr-diff" data-v="${d}">${d}</button>`).join('')}
      <button class="chip ${ui.fav ? 'on' : ''}" data-act="dr-fav" aria-pressed="${ui.fav}">${ICONS.heart} Favorites</button>
    </div></div>
  <div class="dr-hub">
    <nav class="dr-rail" aria-label="Categories">
      <button class="rail-i ${!ui.cat ? 'on' : ''}" data-act="cat-open" data-id=""><span class="cat-g">${ICONS.drawing}</span><b>ALL</b></button>
      ${DRAW_CATEGORIES.map((c) => `<button class="rail-i ${ui.cat === c.id ? 'on' : ''}" data-act="cat-open" data-id="${c.id}"><span class="cat-g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.glyph}</svg></span><b>${c.name}</b></button>`).join('')}
    </nav>
    <div class="dr-main">
      ${feat}
      <div class="tgrid">${rest.map((t) => card(t, featId)).join('')}</div>
      <div class="empty glass dr-empty" ${rest.length ? 'hidden' : ''}>No lessons match. Clear the search or filters.</div>
    </div>
  </div>
  <p class="dr-foot">MASTER THE ART. WATCH. LEARN. EVOLVE.</p>`;
}
function applyFilter(sec) {
  const q = ui.q.trim().toLowerCase(); let n = 0;
  sec.querySelectorAll('.tgrid .tcard').forEach((c) => {
    const filtering = !!(q || ui.diff || ui.fav);
    const ok = (!q || c.dataset.key.includes(q)) && (!ui.diff || c.dataset.diff === ui.diff) && (!ui.fav || c.dataset.fav === '1') && (filtering || !c.dataset.feat);
    c.hidden = !ok; if (ok) n++;
  });
  const e = sec.querySelector('.dr-empty'); if (e) e.hidden = n > 0;
  const f = sec.querySelector('.feat'); if (f) f.hidden = !!(q || ui.diff || ui.fav);
}

// ---------- lesson ----------
function stepPanel(t) {
  const r = rec(t.id) || { step: 0, seen: [] }; const s = t.steps[r.step];
  const all = r.seen.length >= t.steps.length;
  return `<div class="step-card glass" id="step-card">
    <div class="step-top"><span class="eyebrow">STEP ${r.step + 1} OF ${t.steps.length}</span>
      <span class="muted small">${r.seen.length}/${t.steps.length} studied</span></div>
    <h3 class="step-title">${esc(s.title)}</h3><p>${esc(s.text)}</p>
    <div class="step-nav">
      <button class="btn sm ghost" data-act="step-prev" ${r.step === 0 ? 'disabled' : ''}>${ICONS.back} Prev</button>
      <button class="btn sm ghost" data-act="step-say" aria-label="ORB reads this step">${ICONS.voice} ORB reads</button>
      <button class="btn sm ${r.step === t.steps.length - 1 ? 'ghost' : 'pink'}" data-act="step-next" ${r.step === t.steps.length - 1 ? 'disabled' : ''}>Next <span class="flip">${ICONS.back}</span></button>
    </div>
    <div class="step-dots">${t.steps.map((_, i) => `<button class="sd ${i === r.step ? 'cur' : ''} ${r.seen.includes(i) ? 'seen' : ''}" data-act="step-go" data-i="${i}" aria-label="Step ${i + 1}"></button>`).join('')}</div>
    ${r.completedAt ? `<div class="done-row">${ICONS.check} Completed ${new Date(r.completedAt).toLocaleDateString()} · +${LESSON_XP[t.difficulty]} XP earned</div>`
      : `<button class="btn ${all ? 'pink' : 'ghost'} wide" data-act="tut-complete" ${all ? '' : 'disabled'}>${all ? `Complete lesson · +${LESSON_XP[t.difficulty]} XP` : `Study every step to complete (${r.seen.length}/${t.steps.length})`}</button>`}
  </div>`;
}
function paintStep(t) {
  const el = document.getElementById('step-card'); if (!el) return;
  el.outerHTML = stepPanel(t);
  const r = rec(t.id);
  document.querySelectorAll('.steps li').forEach((li, i) => { li.classList.toggle('cur', i === r.step); li.classList.toggle('seen', r.seen.includes(i)); });
}
function renderLesson() {
  const t = byId(ui.tut); const r = rec(t.id) || { step: 0, seen: [], pos: 0 };
  const S = Store.settings; const fav = isFav(t.id);
  const media = t.video
    ? `${t.videoKind === 'demo-animation' ? '<div class="demo-flag">DEMO ANIMATION · generated in code to test the player · not tutorial footage</div>' : ''}<div class="player-slot" data-id="${t.id}">${playerHTML(t, { volume: S.lessonVolume, captions: S.lessonCaptions, rate: S.lessonRate })}</div>
       ${r.pos > 1 && !r.completedAt ? `<div class="muted small resume-note">Resumes at ${fmt(r.pos)} · <button class="linkbtn" data-act="tut-restart">Start over</button></div>` : ''}`
    : `<div class="novid glass"><img src="${esc(t.reference || t.thumbnail)}" alt="${esc(t.title)} reference sketch">
        <div class="novid-msg">${ICONS.play}<b>Video not uploaded yet</b><span>The written steps below are real and count toward completion. The player appears automatically once a video is added to this lesson.</span></div></div>`;
  return `${sectionHeader(t.title, `${catName(t.category)} · ${t.difficulty}`, { back: true })}
  ${media}
  <div class="row gap lesson-acts">
    <button class="btn sm ${fav ? 'pink' : 'ghost'}" data-act="fav" data-id="${t.id}" aria-pressed="${fav}">${ICONS.heart} ${fav ? 'Favorited' : 'Favorite'}</button>
    <span class="tag">${t.steps.length} steps</span><span class="tag">${t.video ? (t.videoKind === 'demo-animation' ? 'Demo animation + captions' : 'Video + captions') : 'No video yet'}</span>
  </div>
  ${t.summary ? `<p class="muted lesson-sum">${esc(t.summary)}</p>` : ''}
  ${t.referenceStep ? `<p class="small muted">Reference image: the drawing at step ${t.referenceStep} of ${t.steps.length} (wings blocked in). Original construction sketch.</p>` : ''}
  ${stepPanel(t)}
  <h3 class="label">All steps</h3>
  <ol class="steps">${t.steps.map((s, i) => `<li class="glass ${i === r.step ? 'cur' : ''} ${r.seen.includes(i) ? 'seen' : ''}" data-act="step-go" data-i="${i}"><span class="sn">${i + 1}</span><span><b>${esc(s.title)}</b><br><span class="muted small">${esc(s.text)}</span></span></li>`).join('')}</ol>`;
}

export function render() {
  if (!library) return `${sectionHeader('DRAWING', 'Loading library…')}`;
  if (loadError && !library.length) return `${sectionHeader('DRAWING', 'Library unavailable')}<div class="empty glass">The lesson list could not be loaded. Check your connection and reopen DRAWING.</div>`;
  if (ui.tut && byId(ui.tut)) return renderLesson();
  return renderHub();
}

export function bind(sec) {
  const q = sec.querySelector('#dr-q');
  if (q) { q.addEventListener('input', () => { ui.q = q.value; applyFilter(sec); }); applyFilter(sec); }
  const t = ui.tut && byId(ui.tut); if (!t) return;
  if (!rec(t.id)) ensureRec(t.id);
  armDwell(t);
  const slot = sec.querySelector('.player-slot');
  if (!slot) return;
  if (playerCache && playerCache.id === t.id) { slot.replaceWith(playerCache.node); return; } // keep the playing <video> across re-renders
  const node = document.createElement('div'); node.className = 'player-slot'; node.dataset.id = t.id;
  while (slot.firstChild) node.appendChild(slot.firstChild);
  slot.replaceWith(node);
  const api = bindPlayer(node.querySelector('.player'), {
    stepTimes: t.stepTimes, startAt: rec(t.id)?.completedAt ? 0 : rec(t.id)?.pos || 0,
    getStep: () => rec(t.id)?.step ?? 0,
    onStep: (i, from) => { if (from === 'video') { markSeen(t, i); setStep(t, i, { from: 'video' }); } else { setStep(t, i, { from: 'video' }); } },
    onTime: (time, d, force) => savePos(time, force),
    onEnded: () => { markSeen(t, t.steps.length - 1); savePos(0, true); },
    onPrefs: (p) => { if ('volume' in p) Store.settings.lessonVolume = p.volume; if ('captions' in p) Store.setSetting('lessonCaptions', p.captions); if ('rate' in p) Store.setSetting('lessonRate', p.rate); },
  });
  playerCache = { id: t.id, node, api };
}

// ---------- actions ----------
const rr = () => document.dispatchEvent(new Event('rerender'));
const act = () => document.dispatchEvent(new Event('activity'));
const cur = () => ui.tut && byId(ui.tut);
onAction('cat-open', (el) => { ui.cat = el.dataset.id || null; play('nav'); rr(); act(); });
onAction('tut-open', (el) => { leaveLesson(); openTutorial(el.dataset.id); ensureRec(el.dataset.id); play('nav'); rr(); act(); setTimeout(() => document.querySelector('.screen.active .screen-scroll')?.scrollTo(0, 0), 0); });
onAction('dr-diff', (el) => { ui.diff = el.dataset.v; play('toggle'); rr(); });
onAction('dr-fav', () => { ui.fav = !ui.fav; play('toggle'); rr(); });
onAction('step-next', () => { const t = cur(); if (t) { play('tap'); setStep(t, rec(t.id).step + 1); } });
onAction('step-prev', () => { const t = cur(); if (t) { play('tap'); setStep(t, rec(t.id).step - 1); } });
onAction('step-go', (el) => { const t = cur(); if (t) { play('tap'); setStep(t, +el.dataset.i); document.getElementById('step-card')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } });
onAction('step-say', () => { const t = cur(); if (!t) return; const r = rec(t.id); const s = t.steps[r.step]; playerCache?.api.pause(); say(`Step ${r.step + 1}. ${s.title}. ${s.text}`); });
onAction('tut-restart', () => { const t = cur(); if (!t) return; Store.updateProfile((p) => { p.tutorials[t.id].pos = 0; }, { silent: true }); if (playerCache) playerCache.api.video.currentTime = 0; setStep(t, 0); document.querySelector('.resume-note')?.remove(); });
onAction('tut-complete', () => {
  const t = cur(); if (!t) return;
  const r = rec(t.id);
  if (r.completedAt) { toast('Already completed', 'Lesson XP is paid once.'); return; }
  if (r.seen.length < t.steps.length) { play('deny'); toast('Not yet', 'Study every step first.'); return; }
  if (completeLesson(t)) { play('claim'); toast(`+${LESSON_XP[t.difficulty]} XP`, `Lesson complete: ${t.title}`, 'xp'); }
  rr(); act();
});
onAction('fav', (el) => {
  const id = el.dataset.id; let added = false;
  Store.updateProfile((p) => { const i = p.bookmarks.indexOf(id); if (i >= 0) p.bookmarks.splice(i, 1); else { p.bookmarks.push(id); added = true; } });
  play(added ? 'claim' : 'tap'); toast(added ? 'Added to favorites' : 'Removed from favorites', added ? 'Find it in DRAWING ▸ Favorites and in your VAULT.' : '');
});
