/* 캐릭터 — SVG 로 그린다. 파일 없음. */
(function (g) {
  'use strict';

  function face(mood, c) {
    const eyes = {
      idle:  `<circle cx="-13" cy="-4" r="4.5" fill="#4a3341"/><circle cx="13" cy="-4" r="4.5" fill="#4a3341"/>
              <circle cx="-11.5" cy="-5.5" r="1.7" fill="#fff"/><circle cx="14.5" cy="-5.5" r="1.7" fill="#fff"/>`,
      happy: `<path d="M-18-5q5-7 10 0" stroke="#4a3341" stroke-width="3.2" fill="none" stroke-linecap="round"/>
              <path d="M8-5q5-7 10 0" stroke="#4a3341" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
      worry: `<ellipse cx="-13" cy="-3" rx="4" ry="5" fill="#4a3341"/><ellipse cx="13" cy="-3" rx="4" ry="5" fill="#4a3341"/>
              <circle cx="-11.5" cy="-5" r="1.6" fill="#fff"/><circle cx="14.5" cy="-5" r="1.6" fill="#fff"/>
              <path d="M-20-13q6-4 11-1" stroke="#4a3341" stroke-width="2.4" fill="none" stroke-linecap="round"/>
              <path d="M20-13q-6-4-11-1" stroke="#4a3341" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
      win:   `<path d="M-19-6q6-9 11 0" stroke="#4a3341" stroke-width="3.4" fill="none" stroke-linecap="round"/>
              <path d="M8-6q6-9 11 0" stroke="#4a3341" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
      sad:   `<path d="M-18-2q5 7 10 0" stroke="#4a3341" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M8-2q5 7 10 0" stroke="#4a3341" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M16 2q2 8 0 12" stroke="#7fd1e8" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      think: `<circle cx="-13" cy="-4" r="4.5" fill="#4a3341"/><circle cx="13" cy="-6" r="3" fill="#4a3341"/>
              <circle cx="-11.5" cy="-5.5" r="1.7" fill="#fff"/>
              <path d="M6-6h13" stroke="#4a3341" stroke-width="2.6" stroke-linecap="round"/>`,
    }[mood] || '';
    const mouth = {
      idle:  `<path d="M-6 9q6 6 12 0" stroke="#4a3341" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
      happy: `<path d="M-9 7q9 12 18 0" stroke="#4a3341" stroke-width="2.8" fill="#ff8fb1" stroke-linecap="round"/>`,
      win:   `<ellipse cx="0" cy="12" rx="10" ry="8" fill="#e8557f"/><ellipse cx="0" cy="16" rx="5" ry="3.5" fill="#ff9dbb"/>`,
      worry: `<path d="M-7 12q7-6 14 0" stroke="#4a3341" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
      sad:   `<path d="M-7 14q7-8 14 0" stroke="#4a3341" stroke-width="2.8" fill="none" stroke-linecap="round"/>`,
      think: `<path d="M-4 11h10" stroke="#4a3341" stroke-width="2.8" stroke-linecap="round"/>`,
    }[mood] || '';
    return `<g>${eyes}${mouth}
      <ellipse cx="-26" cy="6" rx="7" ry="4.5" fill="${c}" opacity=".55"/>
      <ellipse cx="26" cy="6" rx="7" ry="4.5" fill="${c}" opacity=".55"/></g>`;
  }

  let uid = 0;

  /* 딸기 소녀 */
  function berry(mood) {
    const g1 = 'bg' + (++uid);
    return `<svg viewBox="-60 -70 120 130" class="chr">
      <defs><radialGradient id="${g1}" cx=".35" cy=".3"><stop offset="0" stop-color="#ffd3e2"/><stop offset="1" stop-color="#ff7fa8"/></radialGradient></defs>
      <ellipse cx="0" cy="52" rx="34" ry="7" fill="#000" opacity=".07"/>
      <path d="M0-58c-4 0-6 3-9 3s-5-3-8-1 0 7-2 9-7 1-7 4 4 5 4 8" fill="#6fd08c" opacity="0"/>
      <g class="chr-body">
        <path d="M-30-40q30-16 60 0z" fill="#6fd08c"/>
        <path d="M0-52v14" stroke="#4fa86a" stroke-width="5" stroke-linecap="round"/>
        <path d="M0-42c30 0 44 22 44 44S26 50 0 50-44 24-44 2 -30-42 0-42z" fill="url(#${g1})"/>
        <circle cx="-22" cy="16" r="2.3" fill="#fff9" /><circle cx="24" cy="10" r="2.3" fill="#fff9"/>
        <circle cx="0" cy="34" r="2.3" fill="#fff9"/><circle cx="-12" cy="-8" r="2.1" fill="#fff9"/>
        <circle cx="30" cy="30" r="2.1" fill="#fff9"/>
        ${face(mood, '#ff5d90')}
      </g></svg>`;
  }

  /* 블루베리 소년 */
  function blue(mood) {
    const g2 = 'bg' + (++uid);
    return `<svg viewBox="-60 -70 120 130" class="chr">
      <defs><radialGradient id="${g2}" cx=".35" cy=".3"><stop offset="0" stop-color="#d7d5ff"/><stop offset="1" stop-color="#8b86e8"/></radialGradient></defs>
      <ellipse cx="0" cy="52" rx="34" ry="7" fill="#000" opacity=".07"/>
      <g class="chr-body">
        <path d="M0-50v12" stroke="#7bbf8d" stroke-width="5" stroke-linecap="round"/>
        <path d="M-16-46q16-8 32 0-16 8-32 0z" fill="#7bbf8d"/>
        <circle cx="0" cy="4" r="46" fill="url(#${g2})"/>
        <path d="M-13-38q13-6 26 0-6 8-13 8t-13-8z" fill="#6f6ad0" opacity=".5"/>
        <circle cx="-26" cy="20" r="2.3" fill="#fff8"/><circle cx="26" cy="14" r="2.3" fill="#fff8"/>
        ${face(mood, '#7a72dd')}
      </g></svg>`;
  }

  const LINE = {
    greet:   ['같이 놀자~!', '누가 이길까?', '잘 부탁해!', '오늘은 내가 이긴다!'],
    myTurn:  ['음~ 어디 둘까?', '여기다!', '이러면 어때?', '흐음...'],
    urTurn:  ['네 차례야!', '천천히 둬~', '어디 둘 거야?', '기다릴게!'],
    three:   ['앗, 삼목이다!', '조심해야지...', '오~ 좋은데?'],
    four:    ['헉! 사목이야!', '막아야 해!!', '위험해 위험해!'],
    myThree: ['에잇, 삼목!', '이제 시작이야~'],
    danger:  ['으악 막아줘!', '이러면 곤란한데...', '살려줘~'],
    good:    ['우와 잘한다!', '제법인데?', '오~ 똑똑해!'],
    win:     ['내가 이겼다!', '헤헤 이겼지롱~', '다음엔 더 잘해봐!'],
    lose:    ['아쉽다... 한 판 더!', '져버렸어 ㅠㅠ', '다음엔 안 진다!'],
    forbid:  ['거긴 금수야! 못 놔~', '삼삼은 안 돼~', '거긴 반칙이야!'],
    hint:    ['여기 어때?', '나라면 여기!', '이쪽이 좋아 보여~'],
    undo:    ['한 수 무르기!', '다시 생각해봐~'],
    draw:    ['비겼네! 한 판 더?'],
  };
  const say = (k) => { const a = LINE[k] || LINE.myTurn; return a[(Math.random() * a.length) | 0]; };

  g.Chars = { berry, blue, say };
})(window);
