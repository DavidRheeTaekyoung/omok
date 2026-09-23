/* 딸기오목 — 화면 전환과 게임 흐름 */
(function () {
  'use strict';
  const R = window.Renju, SIZE = R.SIZE, BLACK = 1, WHITE = 2;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.prototype.slice.call(document.querySelectorAll(s));
  const St = window.Store, SFX = window.SFX, FX = window.FX, C = window.Chars;

  let view, worker, wreq = 0, pending = null;
  const G = {
    mode: 'ai', level: 'easy',
    human: BLACK, ai: WHITE,
    turn: BLACK, over: false, history: [], busy: false, aiming: null,
  };

  /* ---------- 워커 ---------- */
  function initWorker() {
    try {
      worker = new Worker('js/ai.worker.js');
      worker.onmessage = (e) => {
        const d = e.data;
        if (!pending || d.id !== pending.id) return;
        const cb = pending.cb; pending = null;
        cb(d.move);
      };
      worker.onerror = () => { worker = null; };
    } catch (_) { worker = null; }
  }
  function ask(board, me, level, mode, cb) {
    if (worker) {
      pending = { id: ++wreq, cb: cb };
      worker.postMessage({ id: wreq, board: Array.from(board), me: me, level: level, mode: mode });
    } else {
      setTimeout(() => cb(mode === 'hint' ? window.Engine.hint(board, me) : window.Engine.think(board, me, level)), 30);
    }
  }

  /* ---------- 화면 ---------- */
  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
    if (id === 'game') requestAnimationFrame(() => { view.resize(); FX.resize(); });
    if (id === 'home') paintHome();
    if (id === 'book') paintBook();
  }

  function paintHome() {
    const r = St.rank(), n = St.next();
    $('#rankIcon').textContent = r.icon;
    $('#rankName').textContent = r.name;
    $('#homeStat').textContent = `${St.s.win}승 ${St.s.lose}패` + (St.s.streak > 1 ? ` · ${St.s.streak}연승 중!` : '');
    $('#rankBar').style.width = n ? Math.min(100, (St.s.win - r.n) / (n.n - r.n) * 100) + '%' : '100%';
    $('#rankNext').textContent = n ? `${n.icon} ${n.name}까지 ${n.n - St.s.win}승` : '최고 등급!';
    $('#homeBerry').innerHTML = C.berry(St.s.streak > 1 ? 'win' : 'happy');
  }

  function paintBook() {
    const box = $('#stickerGrid');
    box.innerHTML = St.STICKERS.map((s) => {
      const n = St.s.stickers[s] || 0;
      return `<div class="stk ${n ? 'got' : ''}"><span>${n ? s : '?'}</span>${n > 1 ? `<i>${n}</i>` : ''}</div>`;
    }).join('');
    $('#bookStat').textContent = `모은 스티커 ${Object.keys(St.s.stickers).length} / ${St.STICKERS.length} · 최고 연승 ${St.s.bestStreak}`;
  }

  /* ---------- 말풍선 ---------- */
  let bubbleT = 0;
  function say(who, key, mood) {
    const txt = C.say(key);
    const bub = $(who === 'ai' ? '#aiBubble' : '#meBubble');
    bub.textContent = txt;
    bub.classList.add('on');
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => bub.classList.remove('on'), 2200);
    if (mood) setMood(who, mood);
  }
  function setMood(who, mood) {
    if (who === 'ai') $('#aiChar').innerHTML = G.aiIsBerry ? C.berry(mood) : C.blue(mood);
    else $('#meChar').innerHTML = G.aiIsBerry ? C.blue(mood) : C.berry(mood);
  }

  function popup(text, cls) {
    const el = document.createElement('div');
    el.className = 'popup ' + (cls || '');
    el.textContent = text;
    $('#boardWrap').appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
  function shake() {
    const w = $('#boardWrap');
    w.classList.remove('shake');
    void w.offsetWidth;
    w.classList.add('shake');
  }

  /* ---------- 게임 ---------- */
  function start(mode, level, first) {
    G.mode = mode; G.level = level || 'easy'; G.over = false; G.history = [];
    G.busy = false; G.aiming = null; G.turn = BLACK;
    if (mode === 'ai') {
      G.human = first === 'me' ? BLACK : WHITE;
      G.ai = G.human === BLACK ? WHITE : BLACK;
      G.aiIsBerry = G.ai === BLACK;
    } else {
      G.human = BLACK; G.ai = 0; G.aiIsBerry = false;
    }
    view.clear();
    FX.clear();
    $('#aiName').textContent = mode === 'ai'
      ? ({ easy: '아기 블루베리', normal: '블루베리', hard: '블루베리 대장' }[G.level])
      : '2번 친구 (블루베리)';
    $('#meName').textContent = mode === 'ai' ? '나' : '1번 친구 (딸기)';
    if (G.aiIsBerry) { $('#aiName').textContent += ' 🍓'; $('#meName').textContent += ' 🫐'; }
    setMood('ai', 'idle'); setMood('me', 'idle');
    $('#undoBtn').style.display = mode === 'ai' ? '' : '';
    show('game');
    say('ai', 'greet', 'happy');
    refresh();
    if (mode === 'ai' && G.turn === G.ai) aiMove();
  }

  function refresh() {
    view.showForbid = St.s.forbidMark;
    view.forbid = (!G.over && G.turn === BLACK && St.s.forbidMark) ? R.forbiddenMap(view.board) : [];
    const myTurn = G.over ? false : (G.mode === 'local' || G.turn === G.human);
    $('#turnChip').innerHTML = G.over ? '' :
      `<span class="dot ${G.turn === BLACK ? 'b' : 'w'}"></span>` +
      (G.mode === 'local' ? (G.turn === BLACK ? '딸기 차례' : '블루베리 차례')
        : (myTurn ? '내 차례!' : '생각 중...'));
    $('#game').classList.toggle('waiting', !myTurn && !G.over);
    $('#undoBtn').disabled = G.busy || !G.history.length;
    $('#hintBtn').disabled = G.busy || G.over || !myTurn;
    view.kick();
  }

  function threatsOf(x, y, c) {
    const b = view.board;
    let three = 0, four = 0;
    for (let d = 0; d < 4; d++) {
      const dx = R.DIRS[d][0], dy = R.DIRS[d][1];
      const n = R.runLen(b, x, y, dx, dy, c);
      if (n === 4) four++;
      else if (n === 3) three++;
    }
    return { three: three, four: four };
  }

  function play(x, y, c) {
    const b = view.board;
    if (b[y * SIZE + x] !== 0 || G.over) return false;
    if (c === BLACK) {
      const f = R.forbidden(b, x, y);
      if (f) {
        SFX.p('deny'); shake();
        popup(R.KIND_KO[f] + ' 금수!', 'bad');
        if (G.mode === 'ai') say('ai', 'forbid', 'happy');
        return false;
      }
    }
    view.place(x, y, c);
    G.history.push({ x: x, y: y, c: c });
    SFX.p('place');
    const p = view.px(x, y);
    const off = boardOffset();
    FX.ring(p[0] + off.x, p[1] + off.y, c === BLACK ? '#ff8ab5' : '#a8a2f0');

    const wl = R.winLine(b, x, y, c);
    if (wl) { finish(c, wl); return true; }

    const t = threatsOf(x, y, c);
    if (t.four) {
      SFX.p('four'); shake();
      popup('4목!! 🔥', 'four');
      FX.burst(p[0] + off.x, p[1] + off.y, 26, '#ffd24a');
      if (G.mode === 'ai') say(c === G.human ? 'ai' : 'me', c === G.human ? 'danger' : 'four', c === G.human ? 'worry' : 'idle');
    } else if (t.three) {
      SFX.p('three');
      popup('3목!', 'three');
      FX.burst(p[0] + off.x, p[1] + off.y, 14, c === BLACK ? '#ff8ab5' : '#a8a2f0');
      if (G.mode === 'ai') say(c === G.human ? 'ai' : 'me', c === G.human ? 'good' : 'myThree', c === G.human ? 'worry' : 'happy');
    }

    if (G.history.length >= 225) { finish(0, null); return true; }
    G.turn = c === BLACK ? WHITE : BLACK;
    view.hintCell = null;
    refresh();
    if (G.mode === 'ai' && !G.over && G.turn === G.ai) aiMove();
    return true;
  }

  /* 판 좌표 -> 화면 좌표 (파티클은 화면 전체를 덮는다) */
  function boardOffset() {
    const cr = $('#board').getBoundingClientRect();
    return { x: cr.left + (cr.width - view.size) / 2, y: cr.top + (cr.height - view.size) / 2 };
  }

  function aiMove() {
    G.busy = true; refresh();
    setMood('ai', 'think');
    const t0 = Date.now();
    ask(view.board, G.ai, G.level, 'move', (mv) => {
      const wait = Math.max(0, 320 - (Date.now() - t0));
      setTimeout(() => {
        G.busy = false;
        setMood('ai', 'idle');
        if (G.over || !mv) { refresh(); return; }
        if (view.board[mv.y * SIZE + mv.x] !== 0) { refresh(); return; }
        play(mv.x, mv.y, G.ai);
        if (!G.over && Math.random() < 0.3) say('ai', 'urTurn');
      }, wait);
    });
  }

  function finish(winner, line) {
    G.over = true; G.busy = false;
    view.forbid = []; view.hintCell = null; view.aim = null;
    if (line) view.setWin(line);
    refresh();
    const modal = $('#result');
    let title, sub, mine;
    if (!winner) { title = '비겼어요!'; sub = '한 판 더 할까?'; mine = null; SFX.p('draw'); }
    else {
      mine = (G.mode === 'local') ? null : (winner === G.human);
      if (G.mode === 'local') {
        title = (winner === BLACK ? '🍓 딸기' : '🫐 블루베리') + ' 승리!';
        sub = '축하해요!';
        SFX.p('win'); FX.confetti(110);
      } else if (mine) {
        title = '이겼다! 🎉'; sub = '잘했어요!';
        SFX.p('win'); FX.confetti(120);
        setMood('me', 'win'); setMood('ai', 'sad');
        say('ai', 'lose', 'sad');
      } else {
        title = '아쉬워요...'; sub = '한 번 더 해볼까?';
        SFX.p('lose');
        setMood('me', 'sad'); setMood('ai', 'win');
        say('ai', 'win', 'win');
      }
    }

    let rewardHTML = '';
    if (G.mode === 'ai') {
      const rec = St.record(!winner ? 'draw' : (mine ? 'win' : 'lose'));
      if (rec.sticker) {
        rewardHTML += `<div class="reward"><div class="rw-ico pop">${rec.sticker}</div><div>스티커 획득!</div></div>`;
        setTimeout(() => SFX.p('sticker'), 700);
      }
      if (rec.rankUp) {
        rewardHTML += `<div class="reward"><div class="rw-ico pop">${rec.rankUp.icon}</div><div>등급 상승 · ${rec.rankUp.name}</div></div>`;
        setTimeout(() => { SFX.p('rank'); FX.confetti(70); }, 1100);
      }
      if (St.s.streak > 1 && mine) rewardHTML += `<div class="streak">🔥 ${St.s.streak}연승!</div>`;
    }
    $('#rTitle').textContent = title;
    $('#rSub').textContent = sub;
    $('#rReward').innerHTML = rewardHTML;
    setTimeout(() => modal.classList.add('on'), 900);
  }

  function undo() {
    if (G.busy || !G.history.length) return;
    const steps = (G.mode === 'ai' && G.history.length >= 2 && G.history[G.history.length - 1].c === G.ai) ? 2
      : (G.mode === 'ai' && G.history.length >= 2 ? 2 : 1);
    for (let i = 0; i < steps && G.history.length; i++) {
      const m = G.history.pop();
      view.remove(m.x, m.y);
    }
    G.over = false;
    $('#result').classList.remove('on');
    view.winLine = null;
    const lastM = G.history[G.history.length - 1];
    view.last = lastM ? { x: lastM.x, y: lastM.y, c: lastM.c } : null;
    G.turn = lastM ? (lastM.c === BLACK ? WHITE : BLACK) : BLACK;
    if (G.mode === 'ai') G.turn = G.human;
    SFX.p('undo');
    say('ai', 'undo', 'idle');
    setMood('me', 'idle');
    refresh();
  }

  function hint() {
    if (G.busy || G.over) return;
    const me = G.mode === 'local' ? G.turn : G.human;
    G.busy = true; refresh();
    ask(view.board, me, 'normal', 'hint', (mv) => {
      G.busy = false;
      if (mv) {
        view.hintCell = mv;
        SFX.p('hint');
        say('ai', 'hint', 'happy');
      }
      refresh();
    });
  }

  /* ---------- 입력 ---------- */
  function tapCell(cell) {
    if (G.over || G.busy) return;
    const c = G.mode === 'local' ? G.turn : G.human;
    if (G.mode === 'ai' && G.turn !== G.human) return;
    if (view.board[cell.y * SIZE + cell.x] !== 0) { SFX.p('deny'); return; }
    if (St.s.twoTap) {
      if (view.aim && view.aim.x === cell.x && view.aim.y === cell.y) { view.aim = null; play(cell.x, cell.y, c); }
      else { view.aim = { x: cell.x, y: cell.y, c: c }; SFX.p('tap'); view.kick(); }
    } else {
      view.aim = null;
      play(cell.x, cell.y, c);
    }
  }

  function bindBoard() {
    const cv = $('#board');
    cv.addEventListener('pointerdown', (e) => {
      SFX.unlock();
      const cell = view.cellAt(e.clientX, e.clientY);
      if (cell) tapCell(cell);
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (G.over || G.busy) { view.hover = null; return; }
      const c = G.mode === 'local' ? G.turn : G.human;
      if (G.mode === 'ai' && G.turn !== G.human) { view.hover = null; return; }
      const cell = view.cellAt(e.clientX, e.clientY);
      const nh = cell ? { x: cell.x, y: cell.y, c: c } : null;
      const same = (!nh && !view.hover) || (nh && view.hover && nh.x === view.hover.x && nh.y === view.hover.y);
      view.hover = nh;
      if (!same) view.kick();
    });
    cv.addEventListener('pointerleave', () => { view.hover = null; view.kick(); });
  }

  /* ---------- 부팅 ---------- */
  function boot() {
    view = new window.BoardView($('#board'));
    FX.attach($('#fx'));
    initWorker();
    bindBoard();

    if (St.s.twoTap === null) St.set('twoTap', matchMedia('(pointer: coarse)').matches);
    SFX.set(St.s.sound);
    $('#soundBtn').classList.toggle('off', !St.s.sound);
    $('#optSound').checked = St.s.sound;
    $('#optForbid').checked = St.s.forbidMark;
    $('#optTwoTap').checked = !!St.s.twoTap;

    addEventListener('resize', () => { view.resize(); FX.resize(); });

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-go],[data-act]');
      if (!b) return;
      SFX.unlock();
      if (b.dataset.go) { SFX.p('btn'); show(b.dataset.go); return; }
      const a = b.dataset.act;
      if (a !== 'sound') SFX.p('btn');
      if (a === 'ai') { $('#setup').dataset.mode = 'ai'; show('setup'); }
      else if (a === 'local') { start('local'); }
      else if (a === 'go') {
        const lv = $('.lv.sel').dataset.lv, first = $('.fs.sel').dataset.first;
        St.set('lastLevel', lv); St.set('lastFirst', first);
        start('ai', lv, first);
      }
      else if (a === 'again') { $('#result').classList.remove('on'); start(G.mode, G.level, G.human === BLACK ? 'me' : 'you'); }
      else if (a === 'home') { $('#result').classList.remove('on'); show('home'); }
      else if (a === 'undo') undo();
      else if (a === 'hint') hint();
      else if (a === 'sound') {
        const v = !St.s.sound; St.set('sound', v); SFX.set(v);
        $('#soundBtn').classList.toggle('off', !v);
        $('#optSound').checked = v;
        if (v) SFX.p('btn');
      }
      else if (a === 'settings') $('#settings').classList.add('on');
      else if (a === 'closeSet') $('#settings').classList.remove('on');
      else if (a === 'reset') {
        if (confirm('스티커와 전적을 모두 지울까요?')) { St.reset(); paintHome(); paintBook(); }
      }
    });

    $$('.lv').forEach((el) => el.addEventListener('click', () => {
      $$('.lv').forEach((x) => x.classList.remove('sel')); el.classList.add('sel');
    }));
    $$('.fs').forEach((el) => el.addEventListener('click', () => {
      $$('.fs').forEach((x) => x.classList.remove('sel')); el.classList.add('sel');
    }));
    const lv0 = $(`.lv[data-lv="${St.s.lastLevel}"]`) || $('.lv');
    $$('.lv').forEach((x) => x.classList.remove('sel')); lv0.classList.add('sel');
    const fs0 = $(`.fs[data-first="${St.s.lastFirst}"]`) || $('.fs');
    $$('.fs').forEach((x) => x.classList.remove('sel')); fs0.classList.add('sel');

    $('#optSound').addEventListener('change', (e) => {
      St.set('sound', e.target.checked); SFX.set(e.target.checked);
      $('#soundBtn').classList.toggle('off', !e.target.checked);
    });
    $('#optForbid').addEventListener('change', (e) => { St.set('forbidMark', e.target.checked); refresh(); });
    $('#optTwoTap').addEventListener('change', (e) => { St.set('twoTap', e.target.checked); view.aim = null; view.kick(); });

    window.__omok = { G: G, view: view, play: play, start: start };
    $('#homeBlue').innerHTML = C.blue('idle');
    show('home');
    document.body.classList.remove('loading');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
