/* 판 그리기 — 캔버스. 움직일 게 있을 때만 다시 그린다. */
(function (g) {
  'use strict';
  const R = g.Renju, SIZE = R.SIZE;

  function Board(canvas) {
    this.cv = canvas; this.cx = canvas.getContext('2d');
    this.dpr = 1; this.pad = 0; this.cell = 0; this.size = 0;
    this.board = new Int8Array(225);
    this.last = null; this.aim = null; this.hover = null;
    this.forbid = []; this.winLine = null; this.hintCell = null;
    this.anims = []; this.raf = 0;
    this.showForbid = true;
    this.resize();
  }

  /* 남은 공간을 실제로 재서 정사각으로 꽉 채운다 */
  Board.prototype.resize = function () {
    const box = this.cv.parentElement;
    const r = box.getBoundingClientRect();
    const s = Math.max(160, Math.min(r.width, r.height, Board.MAX));
    this.cv.style.width = s + 'px';
    this.cv.style.height = s + 'px';
    this.dpr = Math.min(2, g.devicePixelRatio || 1);
    this.cv.width = Math.round(s * this.dpr); this.cv.height = Math.round(s * this.dpr);
    this.size = s;
    this.pad = s * 0.07;
    this.cell = (s - this.pad * 2) / (SIZE - 1);
    this.draw();
  };

  Board.prototype.px = function (x, y) { return [this.pad + x * this.cell, this.pad + y * this.cell]; };

  Board.prototype.cellAt = function (cx, cy) {
    const r = this.cv.getBoundingClientRect();
    const sx = cx - r.left - (r.width - this.size) / 2;
    const sy = cy - r.top - (r.height - this.size) / 2;
    const x = Math.round((sx - this.pad) / this.cell);
    const y = Math.round((sy - this.pad) / this.cell);
    if (!R.inB(x, y)) return null;
    const p = this.px(x, y);
    if (Math.hypot(sx - p[0], sy - p[1]) > this.cell * 0.85) return null;
    return { x: x, y: y };
  };

  Board.prototype.place = function (x, y, c, animate) {
    this.board[y * SIZE + x] = c;
    this.last = { x: x, y: y, c: c };
    if (animate !== false) this.anims.push({ k: 'drop', x: x, y: y, c: c, t: performance.now() });
    this.kick();
  };
  Board.prototype.remove = function (x, y) { this.board[y * SIZE + x] = 0; this.kick(); };
  Board.prototype.clear = function () {
    this.board = new Int8Array(225); this.last = null; this.winLine = null;
    this.forbid = []; this.aim = null; this.hintCell = null; this.anims = [];
    this.kick();
  };

  Board.prototype.kick = function () {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
      const now = performance.now();
      this.anims = this.anims.filter((a) => now - a.t < 420);
      if (this.anims.length || this.winLine || this.last || this.hintCell || this.aim) this.kick();
    });
  };

  const ease = (t) => 1 - Math.pow(1 - t, 3);

  Board.prototype.heart = function (px, py, r) {
    const cx = this.cx;
    cx.beginPath();
    cx.moveTo(px, py + r * 0.35);
    cx.bezierCurveTo(px, py - r * 0.4, px - r * 1.1, py - r * 0.25, px - r * 1.1, py + r * 0.3);
    cx.bezierCurveTo(px - r * 1.1, py + r * 0.85, px, py + r * 1.15, px, py + r * 1.4);
    cx.bezierCurveTo(px, py + r * 1.15, px + r * 1.1, py + r * 0.85, px + r * 1.1, py + r * 0.3);
    cx.bezierCurveTo(px + r * 1.1, py - r * 0.25, px, py - r * 0.4, px, py + r * 0.35);
    cx.fill();
  };

  Board.prototype.stone = function (c, x, y, r, alpha) {
    const cx = this.cx;
    cx.save();
    cx.globalAlpha = alpha == null ? 1 : alpha;
    cx.beginPath();
    cx.ellipse(x + r * 0.1, y + r * 0.34, r * 0.92, r * 0.48, 0, 0, 6.283);
    cx.fillStyle = 'rgba(150,90,120,.18)'; cx.fill();
    const gd = cx.createRadialGradient(x - r * 0.33, y - r * 0.38, r * 0.1, x, y, r * 1.1);
    if (c === 1) { gd.addColorStop(0, '#fff3f8'); gd.addColorStop(0.38, '#ffb3cd'); gd.addColorStop(1, '#f25b8b'); }
    else { gd.addColorStop(0, '#f2f0ff'); gd.addColorStop(0.38, '#b7b2f2'); gd.addColorStop(1, '#6b64cd'); }
    cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.fillStyle = gd; cx.fill();
    cx.beginPath(); cx.arc(x, y, r, 0, 6.283);
    cx.strokeStyle = c === 1 ? 'rgba(206,56,106,.45)' : 'rgba(66,58,166,.45)';
    cx.lineWidth = Math.max(1, r * 0.09); cx.stroke();
    cx.beginPath();
    cx.ellipse(x - r * 0.32, y - r * 0.36, r * 0.32, r * 0.2, -0.6, 0, 6.283);
    cx.fillStyle = 'rgba(255,255,255,.88)'; cx.fill();
    cx.beginPath(); cx.arc(x + r * 0.36, y + r * 0.28, r * 0.11, 0, 6.283);
    cx.fillStyle = 'rgba(255,255,255,.5)'; cx.fill();
    cx.restore();
  };

  Board.prototype.draw = function () {
    const cx = this.cx, s = this.size, now = performance.now();
    cx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    cx.clearRect(0, 0, s, s);

    const rad = s * 0.06;
    const bg = cx.createLinearGradient(0, 0, s, s);
    bg.addColorStop(0, '#fffafc'); bg.addColorStop(0.55, '#fff0f6'); bg.addColorStop(1, '#ffe6f1');
    cx.beginPath(); cx.roundRect(1, 1, s - 2, s - 2, rad); cx.fillStyle = bg; cx.fill();
    cx.lineWidth = Math.max(3, s * 0.013); cx.strokeStyle = '#ffc9df'; cx.stroke();

    cx.strokeStyle = 'rgba(228,143,178,.5)';
    cx.lineWidth = Math.max(1, s * 0.0022);
    cx.beginPath();
    for (let i = 0; i < SIZE; i++) {
      const p = this.pad + i * this.cell;
      cx.moveTo(this.pad, p); cx.lineTo(s - this.pad, p);
      cx.moveTo(p, this.pad); cx.lineTo(p, s - this.pad);
    }
    cx.stroke();

    cx.fillStyle = 'rgba(234,112,162,.7)';
    const dots = [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]];
    for (let i = 0; i < dots.length; i++) {
      const p = this.px(dots[i][0], dots[i][1]);
      this.heart(p[0], p[1] - this.cell * 0.09, this.cell * 0.16);
    }

    const rr = this.cell * 0.44;

    if (this.showForbid && this.forbid.length) {
      cx.save();
      cx.lineWidth = Math.max(2, this.cell * 0.1);
      cx.strokeStyle = 'rgba(226,72,104,.55)'; cx.lineCap = 'round';
      for (let i = 0; i < this.forbid.length; i++) {
        const f = this.forbid[i], p = this.px(f.x, f.y), k = this.cell * 0.19;
        cx.beginPath();
        cx.moveTo(p[0] - k, p[1] - k); cx.lineTo(p[0] + k, p[1] + k);
        cx.moveTo(p[0] + k, p[1] - k); cx.lineTo(p[0] - k, p[1] + k);
        cx.stroke();
      }
      cx.restore();
    }

    if (this.hintCell) {
      const p = this.px(this.hintCell.x, this.hintCell.y);
      const t = (now / 500) % 1;
      cx.save();
      cx.globalAlpha = 0.9 - t * 0.7;
      cx.strokeStyle = '#ffb531'; cx.lineWidth = 4;
      cx.beginPath(); cx.arc(p[0], p[1], rr * (0.9 + t * 1.1), 0, 6.283); cx.stroke();
      cx.restore();
    }

    if (this.aim) {
      const p = this.px(this.aim.x, this.aim.y);
      this.stone(this.aim.c, p[0], p[1], rr, 0.55);
      cx.save();
      cx.strokeStyle = '#ff77ac'; cx.lineWidth = 3;
      cx.setLineDash([6, 6]);
      cx.lineDashOffset = -now / 40;
      cx.beginPath(); cx.arc(p[0], p[1], rr * 1.5, 0, 6.283); cx.stroke();
      cx.restore();
    } else if (this.hover && !this.board[this.hover.y * SIZE + this.hover.x]) {
      const p = this.px(this.hover.x, this.hover.y);
      this.stone(this.hover.c, p[0], p[1], rr * 0.9, 0.3);
    }

    const amap = {};
    for (let i = 0; i < this.anims.length; i++) {
      const a = this.anims[i];
      if (a.k === 'drop') amap[a.y * SIZE + a.x] = a;
    }
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const v = this.board[y * SIZE + x];
      if (!v) continue;
      const p = this.px(x, y);
      const a = amap[y * SIZE + x];
      let r = rr, oy = 0;
      if (a) {
        const t = Math.min(1, (now - a.t) / 300), e = ease(t);
        oy = -(1 - e) * this.cell * 1.8;
        r = rr * (0.5 + 0.5 * e + Math.sin(t * Math.PI) * 0.2);
      }
      this.stone(v, p[0], p[1] + oy, r);
    }

    if (this.last && !this.winLine) {
      const p = this.px(this.last.x, this.last.y);
      const t = (now / 800) % 1;
      cx.save();
      cx.globalAlpha = 0.8 - t * 0.6;
      cx.strokeStyle = this.last.c === 1 ? '#ff3d84' : '#564ecb';
      cx.lineWidth = 3;
      cx.beginPath(); cx.arc(p[0], p[1], rr * (1.12 + t * 0.6), 0, 6.283); cx.stroke();
      cx.restore();
    }

    if (this.winLine) {
      const t = Math.min(1, (now - this.winT) / 420);
      const a = this.px(this.winLine[0][0], this.winLine[0][1]);
      const b = this.px(this.winLine[this.winLine.length - 1][0], this.winLine[this.winLine.length - 1][1]);
      cx.save();
      cx.lineCap = 'round';
      cx.strokeStyle = 'rgba(255,226,126,.95)';
      cx.lineWidth = rr * 1.9;
      cx.shadowColor = '#ffcf3d'; cx.shadowBlur = 28;
      cx.globalAlpha = 0.5 + 0.4 * Math.sin(now / 200);
      cx.beginPath(); cx.moveTo(a[0], a[1]);
      cx.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
      cx.stroke();
      cx.restore();
      for (let i = 0; i < this.winLine.length; i++) {
        const w = this.winLine[i], p = this.px(w[0], w[1]);
        this.stone(this.board[w[1] * SIZE + w[0]], p[0], p[1], rr * (1 + 0.12 * Math.sin(now / 170 + i)));
      }
    }
  };

  Board.prototype.setWin = function (line) {
    this.winLine = line; this.winT = performance.now(); this.kick();
  };

  Board.MAX = 760;
  g.BoardView = Board;
})(window);
