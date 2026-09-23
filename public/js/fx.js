/* 파티클 — 색종이, 반짝이, 물결 */
(function (g) {
  'use strict';
  let cv, cx, parts = [], raf = 0, dpr = 1;
  const COLORS = ['#ff7fa8','#ffc2d6','#8b86e8','#c9c5ff','#ffe08a','#8fe3b8','#fff','#ff5d90'];

  function attach(canvas) { cv = canvas; cx = canvas.getContext('2d'); resize(); }
  function resize() {
    if (!cv) return;
    dpr = Math.min(2, g.devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
  }
  const R = (a, b) => a + Math.random() * (b - a);

  function confetti(n) {
    if (!cv) return;
    const w = cv.width / dpr, h = cv.height / dpr;
    for (let i = 0; i < (n || 90); i++) parts.push({
      t: 'c', x: R(0, w), y: R(-h * 0.4, 0), vx: R(-1.2, 1.2), vy: R(2.2, 6),
      w: R(5, 11), h: R(7, 14), a: R(0, 6.3), va: R(-0.22, 0.22),
      c: COLORS[(Math.random() * COLORS.length) | 0], life: R(90, 170),
    });
    run();
  }
  function burst(x, y, n, col) {
    if (!cv) return;
    for (let i = 0; i < (n || 22); i++) {
      const a = R(0, 6.283), s = R(1.6, 6);
      parts.push({ t: 's', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.2, r: R(2.5, 6), c: col || COLORS[(Math.random() * COLORS.length) | 0], life: R(28, 55) });
    }
    run();
  }
  function ring(x, y, col) { if (!cv) return; parts.push({ t: 'r', x, y, r: 6, c: col || '#fff', life: 26 }); run(); }
  function hearts(x, y, n) {
    if (!cv) return;
    for (let i = 0; i < (n || 10); i++) parts.push({ t: 'h', x: x + R(-18, 18), y, vx: R(-.7, .7), vy: R(-3.4, -1.6), r: R(8, 15), c: COLORS[(Math.random() * 4) | 0], life: R(45, 80) });
    run();
  }

  function heartPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * .3);
    c.bezierCurveTo(x, y - s * .3, x - s, y - s * .2, x - s, y + s * .25);
    c.bezierCurveTo(x - s, y + s * .7, x, y + s * .95, x, y + s * 1.15);
    c.bezierCurveTo(x, y + s * .95, x + s, y + s * .7, x + s, y + s * .25);
    c.bezierCurveTo(x + s, y - s * .2, x, y - s * .3, x, y + s * .3);
    c.fill();
  }

  function frame() {
    raf = 0;
    if (!cx) return;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
    const H = cv.height / dpr;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life--;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      cx.globalAlpha = Math.min(1, p.life / 26);
      if (p.t === 'c') {
        p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.a += p.va;
        if (p.y > H + 30) { parts.splice(i, 1); continue; }
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
        cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
      } else if (p.t === 's') {
        p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.vx *= 0.985;
        cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
      } else if (p.t === 'h') {
        p.x += p.vx; p.y += p.vy; p.vy += 0.045;
        cx.fillStyle = p.c; heartPath(cx, p.x, p.y, p.r);
      } else if (p.t === 'r') {
        p.r += 3.4;
        cx.strokeStyle = p.c; cx.lineWidth = 3; cx.globalAlpha = p.life / 26 * 0.8;
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.stroke();
      }
    }
    cx.globalAlpha = 1;
    if (parts.length) run();
  }
  function run() { if (!raf) raf = requestAnimationFrame(frame); }
  function clear() { parts.length = 0; if (cx) cx.clearRect(0, 0, cv.width, cv.height); }

  g.FX = { attach, resize, confetti, burst, ring, hearts, clear };
})(window);
