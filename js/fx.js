// Atmospheric ember / ash particles for the cinematic background.
import { Store } from './store.js';

export function startEmbers(canvas) {
  const g = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, parts = [], last = 0, intensity = 1, running = true;
  const count = () => ({ low: 26, medium: 48, high: 70 }[Store.settings.graphics] || 48) * intensity;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const spawn = (y) => ({
    x: Math.random() * W, y: y ?? H + 10, r: Math.random() * 1.8 + 0.4,
    vy: -(Math.random() * 18 + 8), vx: (Math.random() - 0.5) * 8, life: 0,
    hue: Math.random() < 0.75 ? 330 + Math.random() * 20 : 285, ash: Math.random() < 0.25, ph: Math.random() * 6,
  });
  window.addEventListener('resize', resize); resize();
  for (let i = 0; i < count(); i++) parts.push(spawn(Math.random() * H));
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const fps = Store.settings.fps || 60;
    if (now - last < 1000 / Math.min(fps, 40)) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (document.hidden) return;
    g.clearRect(0, 0, W, H);
    const target = Store.settings.reduceMotion ? Math.round(count() * 0.3) : Math.round(count());
    while (parts.length < target) parts.push(spawn());
    if (parts.length > target) parts.length = target;
    for (const p of parts) {
      p.life += dt; p.y += p.vy * dt; p.x += (p.vx + Math.sin(p.life * 1.3 + p.ph) * 6) * dt;
      if (p.y < -10) Object.assign(p, spawn());
      const a = Math.min(1, p.life) * (0.35 + 0.35 * Math.sin(p.life * 3 + p.ph)) * (p.y / H + 0.2);
      if (p.ash) { g.fillStyle = `rgba(160,150,170,${a * 0.5})`; g.fillRect(p.x, p.y, p.r * 1.4, p.r * 1.4); }
      else {
        g.fillStyle = `hsla(${p.hue},100%,62%,${a})`;
        g.shadowColor = `hsla(${p.hue},100%,60%,${a})`; g.shadowBlur = 6;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
      }
    }
  }
  requestAnimationFrame(frame);
  return { setIntensity(v) { intensity = v; }, stop() { running = false; } };
}
