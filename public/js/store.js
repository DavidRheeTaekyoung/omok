/* 저장 — 설정, 전적, 스티커, 등급 */
(function (g) {
  'use strict';
  const KEY = 'ddalgi-omok-v1';
  const DEF = {
    sound: true, forbidMark: true, twoTap: null, lastLevel: 'easy', lastFirst: 'me',
    win: 0, lose: 0, draw: 0, streak: 0, bestStreak: 0, stickers: {},
  };
  let s = Object.assign({}, DEF);
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} };

  const STICKERS = ['🍓','🫐','🍰','🧁','🍭','🌸','⭐','🌈','🦄','🐰','🐻','🍡','🍒','🎀','💖','🍪','🌷','🐣','🍋','🧸'];
  const RANKS = [
    { n: 0,  name: '새싹',     icon: '🌱' },
    { n: 3,  name: '꽃봉오리', icon: '🌷' },
    { n: 8,  name: '활짝 꽃',  icon: '🌸' },
    { n: 15, name: '반짝 별',  icon: '⭐' },
    { n: 25, name: '왕관',     icon: '👑' },
    { n: 40, name: '전설',     icon: '🦄' },
  ];
  const rankOf = (w) => { let r = RANKS[0]; for (const x of RANKS) if (w >= x.n) r = x; return r; };
  const nextRank = (w) => RANKS.find((x) => x.n > w) || null;

  g.Store = {
    get s() { return s; },
    set(k, v) { s[k] = v; save(); },
    RANKS, STICKERS,
    rank: () => rankOf(s.win),
    next: () => nextRank(s.win),
    record(result) {
      const before = rankOf(s.win).name;
      if (result === 'win') { s.win++; s.streak++; if (s.streak > s.bestStreak) s.bestStreak = s.streak; }
      else if (result === 'lose') { s.lose++; s.streak = 0; }
      else s.draw++;
      let got = null;
      if (result === 'win') {
        const pool = STICKERS.filter((x) => !s.stickers[x]);
        got = pool.length ? pool[(Math.random() * pool.length) | 0] : STICKERS[(Math.random() * STICKERS.length) | 0];
        s.stickers[got] = (s.stickers[got] || 0) + 1;
      }
      const up = rankOf(s.win).name !== before ? rankOf(s.win) : null;
      save();
      return { sticker: got, rankUp: up };
    },
    reset() { s = Object.assign({}, DEF); save(); },
  };
})(window);
