# 딸기오목 🍓

초등학생 딸이 하는 오목. 핑크핑크 귀염상, 팡야/카트라이더 같은 연출.

👉 <https://omok.busangames.com>

## 무엇이 들어 있나

- **렌주룰** 정식 구현 — 흑(딸기)에게 삼삼·사사·장목 금수. 재귀 판정(금수 자리로만 뻗는 삼은 삼이 아니다)까지.
  아이가 막히지 않게 **금수 자리를 판에 ✕ 로 미리 표시**하고, 누르면 반칙패 대신 안내음으로 막는다.
- **AI** — Web Worker 에서 돌아 화면이 안 멈춘다. 후보를 기존 돌 반경 2칸으로 좁히고 → 패턴 평가(활사/사/활삼…)
  → 알파-베타 → VCF(연속 4목 강제승) 탐색. 난이도별 시간 상한 0.15/0.45/1.1초.
- **모드** — 컴퓨터 대전(쉬움·보통·어려움, 선후공 선택) / 한 기기에서 둘이서.
- **편의** — 되돌리기, 힌트, 마지막 수 표시, 두 번 눌러 놓기(터치 기본값), 소리 토글.
- **재미** — 3목·4목 팝업과 화면 흔들림, 승리 시 5목 라인 발광 + 색종이, 캐릭터 응원 멘트,
  스티커 20종 모으기, 등급 새싹 → 꽃봉오리 → 활짝 꽃 → 반짝 별 → 왕관 → 전설.

## 왜 이렇게 만들었나

**파일을 안 받는다.** 이미지도 오디오도 0개다. 캐릭터는 인라인 SVG, 효과음은 Web Audio 로 그 자리에서 합성한다.
빌드도 없다. 바닐라 JS 를 그대로 올린다. 아이가 누르면 바로 떠야 하니까.

**판은 캔버스 한 장.** 움직일 게 있을 때만 rAF 를 돈다. 가만히 있으면 아무것도 안 그린다.

## 구조

```
public/
  index.html  style.css
  js/rules.js       렌주룰 판정 (승리 · 금수)
  js/engine.js      AI (평가 · 알파베타 · VCF)
  js/ai.worker.js   엔진을 워커에서 돌린다
  js/board.js       캔버스 판
  js/sfx.js         합성 효과음
  js/fx.js          파티클
  js/chars.js       캐릭터 SVG · 멘트
  js/store.js       설정 · 전적 · 스티커
  js/main.js        화면 전환과 게임 흐름
```

`rules.js` 와 `engine.js` 는 `globalThis` 에 붙어서 메인 스레드와 워커 양쪽에서 같은 코드를 쓴다.

## 돌려 보기

```bash
python -m http.server 4180 --directory public   # 띄워 보기
npx wrangler deploy                             # 배포 (Cloudflare Workers 정적 자산)
```

## 검증

```bash
node -e "globalThis.self=globalThis;require('./public/js/rules.js');require('./public/js/engine.js');"
```
자가대국 8판에서 흑의 금수 착수 0건, 최대 사고 시간 466ms 확인.
