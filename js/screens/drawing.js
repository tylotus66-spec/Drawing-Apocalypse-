import { Store } from '../store.js';
import { DRAW_CATEGORIES, DIFFICULTIES } from '../content.js';
import { esc, ICONS, onAction, toast } from '../ui.js';
import { play } from '../audio.js';
import { sectionHeader, phasePanel } from './common.js';

let library = null;          // loaded from content/tutorials.json (CMS-ready manifest)
let loadError = null;
const ui = { cat: null, tut: null };

export async function loadLibrary() {
  try {
    const r = await fetch('./content/tutorials.json', { cache: 'no-cache' });
    library = (await r.json()).tutorials || [];
  } catch (e) { loadError = e; library = []; }
}
export function openTutorial(id) {
  const t = library?.find((x) => x.id === id);
  if (t) { ui.cat = t.category; ui.tut = t.id; }
}
export function resetDrawingView() { ui.cat = null; ui.tut = null; }
export function drawingDepth() { return ui.tut ? 2 : ui.cat ? 1 : 0; }
export function drawingBack() { if (ui.tut) ui.tut = null; else ui.cat = null; }

function tutCard(t) {
  const saved = Store.profile.bookmarks.includes(t.id);
  return `<button class="tut-card glass" data-act="tut-open" data-id="${t.id}">
    <div class="tut-ref">${t.reference ? `<img src="${esc(t.reference)}" alt="">` : '<span>Reference art<br>coming</span>'}</div>
    <div class="grow"><b>${esc(t.title)}</b><div class="muted small">${esc(t.difficulty)} · ${t.steps.length} steps</div>
    <div class="small">${t.video ? 'Video ready' : 'Video coming in Phase 2'}</div></div>
    ${saved ? `<span class="pink-ic">${ICONS.bookmark}</span>` : ''}</button>`;
}

function renderRoot() {
  const counts = (id) => (library || []).filter((t) => t.category === id).length;
  return `${sectionHeader('DRAWING', 'Video tutorial library · learn by watching')}
  ${phasePanel(2, 'Lesson videos are on their way', 'The library structure is live. Video lessons, the player, narration and subtitles ship in Phase 2, managed through a content system so new lessons can be added without updating the app.')}
  <h3 class="label">Categories</h3>
  <div class="cat-grid">${DRAW_CATEGORIES.map((c) => `<button class="cat glass" data-act="cat-open" data-id="${c.id}"><span class="cat-g"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.glyph}</svg></span><b>${c.name}</b><small>${counts(c.id)} lesson${counts(c.id) === 1 ? '' : 's'} listed</small></button>`).join('')}</div>
  ${Store.profile.bookmarks.length ? `<h3 class="label">Saved tutorials</h3>${(library || []).filter((t) => Store.profile.bookmarks.includes(t.id)).map(tutCard).join('')}` : ''}`;
}

function renderCat() {
  const c = DRAW_CATEGORIES.find((x) => x.id === ui.cat);
  const tuts = (library || []).filter((t) => t.category === c.id);
  return `${sectionHeader(c.name, 'Drawing category', { back: true })}
  ${DIFFICULTIES.map((d) => {
    const list = tuts.filter((t) => t.difficulty === d);
    return `<section class="diff"><h3 class="label">${d}</h3>${list.length ? list.map(tutCard).join('') : '<div class="empty glass">No videos uploaded yet for this level.</div>'}</section>`;
  }).join('')}`;
}

function renderTut() {
  const t = library.find((x) => x.id === ui.tut);
  const saved = Store.profile.bookmarks.includes(t.id);
  return `${sectionHeader(t.title, `${t.difficulty} · ${t.steps.length} steps`, { back: true })}
  <div class="video-frame glass"><div class="vf-inner">${ICONS.play}<b>Video not uploaded yet</b><span class="muted small">The lesson video and player (play, pause, speed, subtitles, step jumping, resume) arrive in Phase 2. Nothing here is simulated.</span></div></div>
  <div class="row gap"><button class="btn ${saved ? 'pink' : 'ghost'} grow" data-act="bookmark" data-id="${t.id}">${ICONS.bookmark} ${saved ? 'Saved' : 'Save tutorial'}</button></div>
  <dl class="kv glass card"><dt>Category</dt><dd>${esc(DRAW_CATEGORIES.find((c) => c.id === t.category)?.name)}</dd><dt>Difficulty</dt><dd>${esc(t.difficulty)}</dd><dt>Estimated duration</dt><dd>${t.durationMinutes ? t.durationMinutes + ' min' : 'Set when the video is uploaded'}</dd><dt>Steps</dt><dd>${t.steps.length}</dd></dl>
  <h3 class="label">Lesson steps</h3>
  <ol class="steps">${t.steps.map((s, i) => `<li class="glass"><span class="sn">${i + 1}</span><span>${esc(s)}</span></li>`).join('')}</ol>`;
}

export function render() {
  if (!library) return `${sectionHeader('DRAWING', 'Loading library…')}`;
  if (ui.tut && library.find((x) => x.id === ui.tut)) return renderTut();
  if (ui.cat) return renderCat();
  return renderRoot();
}

onAction('cat-open', (el) => { ui.cat = el.dataset.id; ui.tut = null; play('nav'); document.dispatchEvent(new Event('rerender')); });
onAction('tut-open', (el) => { openTutorial(el.dataset.id); play('nav'); document.dispatchEvent(new Event('rerender')); });
onAction('bookmark', (el) => {
  const id = el.dataset.id; let added = false;
  Store.updateProfile((p) => { const i = p.bookmarks.indexOf(id); if (i >= 0) p.bookmarks.splice(i, 1); else { p.bookmarks.push(id); added = true; } });
  play(added ? 'claim' : 'tap'); toast(added ? 'Tutorial saved' : 'Removed from saved', added ? 'Find it in DRAWING and your VAULT.' : '');
});
