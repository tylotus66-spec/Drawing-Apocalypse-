// ORB guide screen (design sheet screen 9): the large live ORB, its current
// line of guidance, and real destinations. Tips come from content.js; there is
// no AI here (Ask ORB is the scripted help-topic sheet).
import { Store } from '../store.js';
import { isCreateUnlocked } from '../progression.js';
import { CREATE_UNLOCK_LEVEL } from '../config.js';
import { esc, ICONS } from '../ui.js';
import { sectionHeader } from './common.js';
import { greeting } from './home.js';

export function render() {
  const p = Store.profile;
  const createOpen = isCreateUnlocked();
  const dest = [
    ['survival', 'SURVIVAL', 'Mode select · playable in Phase 3'],
    ['drawing', 'DRAWING', 'Video lessons, step by step'],
    ['create', 'CREATE', createOpen ? 'Creator unlocked' : `Sealed until level ${CREATE_UNLOCK_LEVEL}`],
    ['vault', 'VAULT', 'Elements, achievements, characters'],
  ];
  return `${sectionHeader('ORB', 'The Eternal Guide', { orb: false })}
  <section class="orb-stage">
    <button class="orb-hit orb-hit-xl" data-act="orb-tap" aria-label="Tap ORB for guidance"><div class="orb-slot orb-slot-xl"></div></button>
    <div class="orb-bubble" id="orb-msg" aria-live="polite">${esc(greeting(p))}</div>
  </section>
  <p class="eyebrow center orb-q">Where shall we go?</p>
  <nav class="orb-dest">
    ${dest.map(([to, name, sub], i) => `<button class="dest d${i}" data-act="go" data-to="${to}"><span class="dest-ic">${to === 'create' && !createOpen ? ICONS.lock : ICONS[to]}</span><b>${name}</b><small>${esc(sub)}</small><span class="chev">${ICONS.back}</span></button>`).join('')}
  </nav>
  <div class="row gap center orb-acts"><button class="btn ghost sm" data-act="orb-tap">${ICONS.voice} Hear guidance</button><button class="btn ghost sm" data-act="ask">Ask ORB</button></div>
  <p class="muted small center">Story chapters are not part of the current build plan yet, so they are not listed here.</p>`;
}
