// Shared UI helpers: escaping, icons, toasts, sheets, confirm, action registry.
import { play } from './audio.js';
import { Store } from './store.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICONS = {
  home: sv('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  drawing: sv('<path d="M4 20c2.5 0 4-1.2 4.4-3.3L17.8 7.3a2 2 0 0 0-2.8-2.8L5.6 13.9C3.5 14.3 4 17.5 4 20Z"/><path d="m13.5 6 4.5 4.5"/>'),
  survival: sv('<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>'),
  create: sv('<path d="M7 3c0 6 10 6 10 12s-10 6-10 6"/><path d="M17 3c0 6-10 6-10 12"/><path d="M8.5 7h7M8.5 17h7"/>'),
  vault: sv('<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V7M15.5 12H17M12 15.5V17M8.5 12H7"/><path d="M5.5 20v1.5M18.5 20v1.5"/>'),
  bell: sv('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  lock: sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/>'),
  back: sv('<path d="M15 5 8 12l7 7"/>'),
  close: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  star: sv('<path d="m12 3 2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6Z"/>'),
  bookmark: sv('<path d="M6 3.5h12V21l-6-4-6 4Z"/>'),
  play: sv('<path d="M7 4.5v15l12-7.5Z"/>'),
  send: sv('<path d="M4 12 20 4l-6 16-3-7Z"/>'),
  rotate: sv('<rect x="7" y="2.5" width="10" height="19" rx="2" transform="rotate(90 12 12)"/><path d="M4 6a8 8 0 0 1 6-3.5M20 18a8 8 0 0 1-6 3.5"/>'),
  exit: sv('<path d="M15 4h4v16h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>'),
  upload: sv('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'),
  download: sv('<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>'),
};

// ---- action registry (event delegation) ----
const actions = {};
export function onAction(name, fn) { actions[name] = fn; }
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); haptic(); fn(el, e); }
});

export function haptic(ms = 8) {
  if (Store.settings.vibration && navigator.vibrate) { try { navigator.vibrate(ms); } catch {} }
}

// ---- toasts ----
export function toast(title, body = '', kind = 'info') {
  const root = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = `<div class="toast-title">${esc(title)}</div>${body ? `<div class="toast-body">${esc(body)}</div>` : ''}`;
  root.appendChild(el);
  while (root.children.length > 3) root.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
}

// ---- bottom sheets / dialogs ----
let sheetClose = null;
export function openSheet(html, { onMount, onClose, cls = '' } = {}) {
  closeSheet(true);
  const root = document.getElementById('sheet-root');
  root.innerHTML = `<div class="sheet-backdrop" data-act="sheet-close"></div><div class="sheet glass ${cls}" role="dialog" aria-modal="true"><button class="icon-btn sheet-x" data-act="sheet-close" aria-label="Close">${ICONS.close}</button><div class="sheet-body">${html}</div></div>`;
  root.classList.add('open');
  document.body.classList.add('sheet-open');
  play('open');
  sheetClose = onClose || null;
  onMount?.(root.querySelector('.sheet'));
  return root.querySelector('.sheet');
}
export function closeSheet(silent) {
  const root = document.getElementById('sheet-root');
  if (!root || !root.classList.contains('open')) return;
  root.classList.remove('open');
  document.body.classList.remove('sheet-open');
  root.innerHTML = '';
  const fn = sheetClose; sheetClose = null; fn?.();
  if (!silent) play('tap');
}
export function sheetOpen() { return document.getElementById('sheet-root')?.classList.contains('open'); }
onAction('sheet-close', () => closeSheet());

export function confirmDialog(title, body, okLabel = 'Confirm') {
  return new Promise((resolve) => {
    let answered = false;
    openSheet(`<h2 class="h2">${esc(title)}</h2><p class="muted">${esc(body)}</p>
      <div class="row gap"><button class="btn ghost" data-act="dlg-no">Cancel</button><button class="btn danger" data-act="dlg-yes">${esc(okLabel)}</button></div>`,
    { cls: 'sheet-small', onClose: () => { if (!answered) resolve(false); } });
    onAction('dlg-yes', () => { answered = true; closeSheet(); resolve(true); });
    onAction('dlg-no', () => { answered = true; closeSheet(); resolve(false); });
  });
}

export function avatarHTML(profile, size = 44) {
  if (profile?.avatar) return `<img class="avatar" src="${esc(profile.avatar)}" alt="" style="width:${size}px;height:${size}px">`;
  const ch = esc((profile?.username || '?').slice(0, 1).toUpperCase());
  return `<span class="avatar avatar-sigil" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px">${ch}</span>`;
}

export function bar(pct, cls = '') {
  return `<div class="bar ${cls}"><i style="width:${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%"></i></div>`;
}

/** Resize a picked image file to a small square JPEG data URL. */
export function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('Choose an image file'));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'); const s = Math.min(img.width, img.height);
      g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = URL.createObjectURL(file);
  });
}
