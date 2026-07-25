/**
 * 元首办公室 — 主入口 v0.1
 * 完整游戏逻辑见 docs/GAME_SCRIPT_OUTLINE.md
 */

const state = {
  date: new Date(1936, 0, 1),
  paused: true,
  speed: 1,
  autoPauseOnEvent: true,
  stability: 75,
  tension: 12,
};

const els = {
  textStream: document.getElementById('text-stream'),
  dateDisplay: document.getElementById('date-display'),
  btnPause: document.getElementById('btn-pause'),
  stability: document.getElementById('stability'),
  tension: document.getElementById('tension'),
};

function formatDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function appendLine(text, className = '') {
  const p = document.createElement('p');
  if (className) p.className = className;
  p.textContent = text;
  els.textStream.appendChild(p);
  els.textStream.scrollTop = els.textStream.scrollHeight;
}

function tick() {
  if (state.paused) return;
  state.date.setDate(state.date.getDate() + 1);
  els.dateDisplay.textContent = formatDate(state.date);
}

let lastTick = 0;
const MS_PER_DAY = { 1: 1000, 3: 333, 5: 100 };

function gameLoop(timestamp) {
  if (!state.paused && timestamp - lastTick >= MS_PER_DAY[state.speed]) {
    tick();
    lastTick = timestamp;
  }
  requestAnimationFrame(gameLoop);
}

function setPaused(paused) {
  state.paused = paused;
  els.btnPause.textContent = paused ? '▶' : '⏸';
  els.btnPause.classList.toggle('paused', paused);
  els.btnPause.title = paused ? '继续' : '暂停';
}

els.btnPause.addEventListener('click', () => setPaused(!state.paused));

document.querySelectorAll('.speed-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.speed = Number(btn.dataset.speed);
  });
});

function showOpening() {
  appendLine('我醒来时，窗外柏林的天空是铅灰色的。', 'narrative');
  appendLine('新年。帝国的第三年——不，用我们的说法，是民族觉醒后的第三年。', 'narrative');
  appendLine('[SYS] 日期: 1936-01-01 | 稳定度: 75 | 战争支持度: 30', 'sys');
  appendLine('[DIP] 奥地利: 关系 55 | 捷克斯洛伐克: 关系 10 | 法国: 关系 -40', 'dip');
  appendLine('[FOC] 国策树已解锁。完整脚本见设计文档。', 'foc');
  appendLine('[EVT] 游戏已自动暂停。点击 ▶ 继续时间流逝。', 'evt');
}

els.dateDisplay.textContent = formatDate(state.date);
showOpening();
requestAnimationFrame(gameLoop);
