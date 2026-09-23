/* 딸기오목 — AI 엔진 (워커와 메인 양쪽에서 쓴다) */
(function (g) {
  'use strict';
  const R = g.Renju;
  const SIZE = R.SIZE, EMPTY = 0, DIRS = R.DIRS;

  const S = { FIVE: 10000000, OPEN4: 200000, FOUR: 12000, OPEN3: 9000, THREE: 900, OPEN2: 400, TWO: 90, ONE: 10 };

  /* (x,y) 에 me 가 있다고 보고 한 방향 모양 점수 */
  function dirScore(b, x, y, dx, dy, me) {
    const opp = me === 1 ? 2 : 1;
    const line = new Int8Array(9);
    for (let i = -4; i <= 4; i++) {
      const cx = x + dx * i, cy = y + dy * i;
      line[i + 4] = (i === 0) ? me : (R.inB(cx, cy) ? b[cy * SIZE + cx] : opp);
    }
    let c5 = 0, c4 = 0, c3 = 0, c2 = 0;
    for (let s = 0; s < 5; s++) {
      let n = 0, bad = false;
      for (let k = 0; k < 5; k++) { const v = line[s + k]; if (v === opp) { bad = true; break; } if (v === me) n++; }
      if (bad) continue;
      if (n === 5) c5++; else if (n === 4) c4++; else if (n === 3) c3++; else if (n === 2) c2++;
    }
    if (c5) return S.FIVE;
    if (c4 >= 2) return S.OPEN4;
    if (c4 === 1) return S.FOUR;
    if (c3 >= 2) return S.OPEN3;
    if (c3 === 1) return S.THREE;
    if (c2 >= 2) return S.OPEN2;
    if (c2 === 1) return S.TWO;
    return S.ONE;
  }

  function pointScore(b, x, y, me) {
    let t = 0;
    for (let d = 0; d < 4; d++) t += dirScore(b, x, y, DIRS[d][0], DIRS[d][1], me);
    return t;
  }

  /* 판 전체 평가 (me 관점) */
  function evaluate(b, me) {
    const opp = me === 1 ? 2 : 1;
    let mine = 0, theirs = 0;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const v = b[y * SIZE + x];
      if (v === EMPTY) continue;
      if (v === me) mine += pointScore(b, x, y, me);
      else theirs += pointScore(b, x, y, opp);
    }
    return mine - theirs * 1.15;
  }

  const hasNeighbor = (b, x, y, r) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (!i && !j) continue;
      const cx = x + i, cy = y + j;
      if (R.inB(cx, cy) && b[cy * SIZE + cx] !== EMPTY) return true;
    }
    return false;
  };

  /* 둘 만한 자리 — 기존 돌 반경 2칸, 좋은 순으로 정렬 */
  function candidates(b, me, limit) {
    const opp = me === 1 ? 2 : 1;
    const out = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (b[y * SIZE + x] !== EMPTY) continue;
      if (!hasNeighbor(b, x, y, 2)) continue;
      if (me === 1 && R.forbidden(b, x, y)) continue;
      out.push({ x, y, v: pointScore(b, x, y, me) + pointScore(b, x, y, opp) * 0.9 });
    }
    out.sort((p, q) => q.v - p.v);
    return out.slice(0, limit);
  }

  const wins = (b, x, y, c) => { b[y * SIZE + x] = c; const w = R.winLine(b, x, y, c); b[y * SIZE + x] = EMPTY; return w; };

  /* 한 수로 이기는 자리 */
  function winningMove(b, c) {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (b[y * SIZE + x] !== EMPTY) continue;
      if (!hasNeighbor(b, x, y, 2)) continue;
      if (c === 1 && R.forbidden(b, x, y)) continue;
      if (wins(b, x, y, c)) return { x, y };
    }
    return null;
  }

  /* 상대가 다음 수로 이기는 자리 전부 */
  function threatCells(b, c) {
    const out = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (b[y * SIZE + x] !== EMPTY) continue;
      if (!hasNeighbor(b, x, y, 2)) continue;
      if (c === 1 && R.forbidden(b, x, y)) continue;
      if (wins(b, x, y, c)) out.push({ x, y });
    }
    return out;
  }

  /* VCF — 사(四) 로만 몰아붙여 강제승이 나는지 */
  function vcf(b, me, depth, deadline) {
    if (depth <= 0 || Date.now() > deadline) return null;
    const opp = me === 1 ? 2 : 1;
    const now = winningMove(b, me);
    if (now) return now;
    const cands = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (b[y * SIZE + x] !== EMPTY) continue;
      if (!hasNeighbor(b, x, y, 1)) continue;
      if (me === 1 && R.forbidden(b, x, y)) continue;
      const sc = pointScore(b, x, y, me);
      if (sc >= S.FOUR) cands.push({ x, y, v: sc });
    }
    cands.sort((p, q) => q.v - p.v);
    for (const m of cands.slice(0, 10)) {
      b[m.y * SIZE + m.x] = me;
      const blocks = threatCells(b, me);
      let ok = false;
      if (blocks.length >= 2) ok = true;                 // 막을 수 없는 사 두 개
      else if (blocks.length === 1) {
        const d = blocks[0];
        b[d.y * SIZE + d.x] = opp;
        if (!winningMove(b, opp)) ok = !!vcf(b, me, depth - 1, deadline);
        b[d.y * SIZE + d.x] = EMPTY;
      }
      b[m.y * SIZE + m.x] = EMPTY;
      if (ok) return m;
    }
    return null;
  }

  function negamax(b, me, turn, depth, alpha, beta, width, deadline) {
    const opp = turn === 1 ? 2 : 1;
    const w = winningMove(b, turn);
    if (w) { const s = S.FIVE * (depth + 1); return { score: turn === me ? s : -s, move: w }; }
    if (depth <= 0 || Date.now() > deadline) return { score: evaluate(b, me) };

    const cands = candidates(b, turn, width);
    if (!cands.length) return { score: evaluate(b, me) };

    const nw = Math.max(4, width - 2);
    let best = cands[0];
    if (turn === me) {
      let v = -Infinity;
      for (const m of cands) {
        b[m.y * SIZE + m.x] = turn;
        const r = negamax(b, me, opp, depth - 1, alpha, beta, nw, deadline);
        b[m.y * SIZE + m.x] = EMPTY;
        if (r.score > v) { v = r.score; best = m; }
        if (v > alpha) alpha = v;
        if (alpha >= beta || Date.now() > deadline) break;
      }
      return { score: v, move: best };
    }
    let v = Infinity;
    for (const m of cands) {
      b[m.y * SIZE + m.x] = turn;
      const r = negamax(b, me, opp, depth - 1, alpha, beta, nw, deadline);
      b[m.y * SIZE + m.x] = EMPTY;
      if (r.score < v) { v = r.score; best = m; }
      if (v < beta) beta = v;
      if (alpha >= beta || Date.now() > deadline) break;
    }
    return { score: v, move: best };
  }

  const LEVELS = {
    easy:   { depth: 2, width: 7,  ms: 150,  vcf: 0,  slip: 0.35 },
    normal: { depth: 4, width: 9,  ms: 450,  vcf: 6,  slip: 0.07 },
    hard:   { depth: 6, width: 12, ms: 1100, vcf: 12, slip: 0 },
  };

  function think(board, me, level) {
    const b = Int8Array.from(board);
    const cfg = LEVELS[level] || LEVELS.normal;
    const deadline = Date.now() + cfg.ms;
    const opp = me === 1 ? 2 : 1;

    let empty = 0;
    for (let i = 0; i < b.length; i++) if (b[i] === EMPTY) empty++;
    if (empty === 225) return { x: 7, y: 7 };

    const win = winningMove(b, me);
    if (win) return win;

    const block = threatCells(b, opp);
    if (block.length) return block[0];

    if (cfg.vcf) { const v = vcf(b, me, cfg.vcf, deadline); if (v) return { x: v.x, y: v.y }; }

    if (cfg.slip && Math.random() < cfg.slip) {
      const c = candidates(b, me, 8);
      if (c.length > 2) return c[1 + ((Math.random() * Math.min(4, c.length - 1)) | 0)];
    }

    let best = null;
    for (let d = 2; d <= cfg.depth; d += 2) {
      const r = negamax(b, me, me, d, -Infinity, Infinity, cfg.width, deadline);
      if (r.move) best = r.move;
      if (Date.now() > deadline) break;
    }
    if (!best) { const c = candidates(b, me, 1); best = c[0]; }
    if (!best) { for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (b[y * SIZE + x] === EMPTY && !(me === 1 && R.forbidden(b, x, y))) return { x, y }; }
    return { x: best.x, y: best.y };
  }

  /* 힌트 — 사람 편을 위한 한 수 */
  function hint(board, me) { return think(board, me, 'normal'); }

  g.Engine = { think, hint, evaluate, pointScore, candidates, winningMove, threatCells, S };
})(typeof self !== 'undefined' ? self : globalThis);
