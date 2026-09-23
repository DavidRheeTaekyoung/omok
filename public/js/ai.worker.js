/* AI 전용 워커 — 여기서 생각해야 화면이 안 멈춘다 */
importScripts('rules.js', 'engine.js');
self.onmessage = (e) => {
  const { id, board, me, level, mode } = e.data;
  const t0 = Date.now();
  const mv = mode === 'hint' ? self.Engine.hint(board, me) : self.Engine.think(board, me, level);
  self.postMessage({ id, move: mv, ms: Date.now() - t0 });
};
