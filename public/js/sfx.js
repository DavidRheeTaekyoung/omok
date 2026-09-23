/* 합성 효과음 — 파일 0개. 전부 그 자리에서 만든다. */
(function (g) {
  'use strict';
  let ctx = null, on = true, master = null;

  function init() {
    if (ctx) return ctx;
    const AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    return ctx;
  }
  const resume = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };

  /* 한 음 */
  function tone(f, t0, dur, type, vol, f2) {
    if (!ctx) return;
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn); gn.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, vol) {
    if (!ctx) return;
    const n = ctx.sampleRate * dur | 0;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gn = ctx.createGain(); gn.gain.value = vol || 0.12;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400;
    src.connect(bp); bp.connect(gn); gn.connect(master); src.start(t0);
  }
  const seq = (notes, gap, type, vol) => {
    if (!ctx) return; const t = ctx.currentTime;
    notes.forEach((f, i) => tone(f, t + i * gap, gap * 1.9, type, vol));
  };

  const N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568, A4: 440, F4: 349.23, D4: 293.66 };

  const play = {
    place() { const t = ctx.currentTime; tone(520, t, 0.1, 'sine', 0.35, 900); tone(1200, t + 0.02, 0.07, 'triangle', 0.14); noise(t, 0.05, 0.06); },
    tap()   { const t = ctx.currentTime; tone(880, t, 0.05, 'sine', 0.12); },
    btn()   { const t = ctx.currentTime; tone(740, t, 0.07, 'triangle', 0.18, 1100); },
    deny()  { const t = ctx.currentTime; tone(200, t, 0.16, 'square', 0.16, 130); },
    three() { seq([N.C5, N.E5, N.G5], 0.075, 'triangle', 0.28); },
    four()  { seq([N.G5, N.C6, N.G5, N.C6], 0.08, 'square', 0.16); },
    hint()  { seq([N.G5, N.C6, N.E6], 0.06, 'sine', 0.22); },
    undo()  { const t = ctx.currentTime; tone(700, t, 0.16, 'sine', 0.2, 320); },
    win()   { seq([N.C5, N.E5, N.G5, N.C6, N.G5, N.C6, N.E6], 0.11, 'triangle', 0.3); setTimeout(() => seq([N.G6], 0.3, 'sine', 0.2), 800); },
    lose()  { seq([N.G5, N.E5, N.D5, N.A4], 0.16, 'sine', 0.22); },
    draw()  { seq([N.E5, N.D5, N.E5], 0.14, 'sine', 0.2); },
    sticker(){ seq([N.C6, N.E6, N.G6, N.E6, N.G6], 0.06, 'sine', 0.22); },
    rank()  { seq([N.C5, N.G5, N.C6, N.E6, N.G6], 0.09, 'triangle', 0.3); },
    pop()   { const t = ctx.currentTime; tone(1000, t, 0.06, 'sine', 0.2, 1600); },
  };

  g.SFX = {
    unlock() { init(); resume(); },
    set(v) { on = v; if (master) master.gain.value = v ? 0.32 : 0; },
    get() { return on; },
    p(name) { if (!on) return; if (!init()) return; resume(); const f = play[name]; if (f) try { f(); } catch (_) {} },
  };
})(window);
