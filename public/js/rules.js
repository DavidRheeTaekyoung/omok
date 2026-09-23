/* 딸기오목 — 렌주룰 판정기
   흑(딸기)에게만 금수: 3·3, 4·4, 장목(6목 이상)
   백(블루베리)은 제한 없음, 장목도 승리
   globalThis.Renju 로 노출 — 메인 스레드와 워커 양쪽에서 쓴다. */
(function (g) {
  'use strict';

  const SIZE = 15;
  const EMPTY = 0, BLACK = 1, WHITE = 2;
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

  const inB = (x, y) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;
  const at = (b, x, y) => (inB(x, y) ? b[y * SIZE + x] : -1);

  /* (x,y) 에 돌이 이미 놓여 있다고 보고 한 방향 연속 개수 */
  function runLen(b, x, y, dx, dy, c) {
    let n = 1;
    for (let i = 1; i < SIZE; i++) { if (at(b, x + dx * i, y + dy * i) === c) n++; else break; }
    for (let i = 1; i < SIZE; i++) { if (at(b, x - dx * i, y - dy * i) === c) n++; else break; }
    return n;
  }

  /* 이긴 줄의 좌표들. 없으면 null. (돌은 이미 놓인 상태) */
  function winLine(b, x, y, c) {
    for (const [dx, dy] of DIRS) {
      const n = runLen(b, x, y, dx, dy, c);
      if (c === BLACK ? n === 5 : n >= 5) {
        let sx = x, sy = y;
        while (at(b, sx - dx, sy - dy) === c) { sx -= dx; sy -= dy; }
        const line = [];
        for (let i = 0; i < n; i++) line.push([sx + dx * i, sy + dy * i]);
        return line;
      }
    }
    return null;
  }

  /* 이 방향에 만들어진 '사'의 개수.
     p 를 포함하는 5칸 창 중 (흑4 + 빈1) 인 것을 모으고, 빈칸을 채웠을 때
     정확히 5가 되는 것만 인정한다. 같은 흑돌 4개짜리는 하나로 친다
     (열린 사 = 사 하나). */
  function fourCount(b, x, y, dx, dy) {
    const seen = new Set();
    for (let s = -4; s <= 0; s++) {
      const blacks = [];
      let hole = -1, ok = true;
      for (let k = 0; k < 5; k++) {
        const cx = x + dx * (s + k), cy = y + dy * (s + k);
        if (!inB(cx, cy)) { ok = false; break; }
        const v = b[cy * SIZE + cx];
        if (v === BLACK) blacks.push(cy * SIZE + cx);
        else if (v === EMPTY) { if (hole >= 0) { ok = false; break; } hole = cy * SIZE + cx; }
        else { ok = false; break; }
      }
      if (!ok || blacks.length !== 4 || hole < 0) continue;
      b[hole] = BLACK;
      const hx = hole % SIZE, hy = (hole / SIZE) | 0;
      const exact = runLen(b, hx, hy, dx, dy, BLACK) === 5;  // 장목이면 사가 아니다
      b[hole] = EMPTY;
      if (exact) seen.add(blacks.join(','));
    }
    return seen.size;
  }

  /* (x,y) 를 지나는 이 방향 모양이 '달사'(열린 사)인가 — 연속 4 + 양끝 빈칸 + 장목 안 남 */
  function isStraightFour(b, x, y, dx, dy) {
    let hi = 0, lo = 0;
    while (at(b, x + dx * (hi + 1), y + dy * (hi + 1)) === BLACK) hi++;
    while (at(b, x - dx * (lo + 1), y - dy * (lo + 1)) === BLACK) lo++;
    if (lo + hi + 1 !== 4) return false;
    const ax = x + dx * (hi + 1), ay = y + dy * (hi + 1);
    const bx = x - dx * (lo + 1), by = y - dy * (lo + 1);
    if (at(b, ax, ay) !== EMPTY || at(b, bx, by) !== EMPTY) return false;
    if (at(b, ax + dx, ay + dy) === BLACK) return false;
    if (at(b, bx - dx, by - dy) === BLACK) return false;
    return true;
  }

  /* 이 방향에 '활삼'이 있는가 — 한 수 더 두면 달사가 되는 자리가 있고,
     그 자리가 흑에게 금수가 아니어야 한다 (재귀). */
  function hasOpenThree(b, x, y, dx, dy, depth) {
    for (let s = -4; s <= 4; s++) {
      if (s === 0) continue;
      const cx = x + dx * s, cy = y + dy * s;
      if (!inB(cx, cy)) continue;
      const q = cy * SIZE + cx;
      if (b[q] !== EMPTY) continue;
      b[q] = BLACK;
      let good = false;
      if (isStraightFour(b, cx, cy, dx, dy)) good = !forbiddenHere(b, cx, cy, depth + 1);
      b[q] = EMPTY;
      if (good) return true;
    }
    return false;
  }

  /* 흑돌이 이미 (x,y) 에 놓인 상태에서 금수인가.
     false | 'overline' | 'four' | 'three' */
  function forbiddenHere(b, x, y, depth) {
    if (depth > 5) return false;
    let overline = false;
    for (const [dx, dy] of DIRS) {
      const n = runLen(b, x, y, dx, dy, BLACK);
      if (n === 5) return false;          // 오목 완성이면 금수보다 승리가 먼저
      if (n >= 6) overline = true;
    }
    if (overline) return 'overline';

    let fours = 0;
    for (const [dx, dy] of DIRS) fours += fourCount(b, x, y, dx, dy);
    if (fours >= 2) return 'four';

    let threes = 0;
    for (const [dx, dy] of DIRS) if (hasOpenThree(b, x, y, dx, dy, depth)) threes++;
    if (threes >= 2) return 'three';

    return false;
  }

  /* 빈 칸 (x,y) 에 흑이 두면 금수인가 */
  function forbidden(b, x, y) {
    const i = y * SIZE + x;
    if (b[i] !== EMPTY) return false;
    b[i] = BLACK;
    const r = forbiddenHere(b, x, y, 0);
    b[i] = EMPTY;
    return r;
  }

  /* 판 전체의 흑 금수 자리 (표시용) */
  function forbiddenMap(b) {
    const out = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (b[y * SIZE + x] !== EMPTY) continue;
      const r = forbidden(b, x, y);
      if (r) out.push({ x, y, kind: r });
    }
    return out;
  }

  const KIND_KO = { overline: '장목', four: '사사', three: '삼삼' };

  g.Renju = {
    SIZE, EMPTY, BLACK, WHITE, DIRS, KIND_KO,
    inB, at, runLen, winLine, forbidden, forbiddenMap, isStraightFour, fourCount
  };
})(typeof self !== 'undefined' ? self : globalThis);
