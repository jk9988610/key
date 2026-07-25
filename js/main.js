import dailyEvents from './data/daily_events.js';
import { createDayCycle } from './dayCycle.js';
import { createOutput } from './consoleOutput.js';
import { createEventUI } from './events.js';
import { createNotebook } from './notebook.js';
import { createInitialState, formatDateCN, LOCATION_NAMES } from './state.js';

const state = createInitialState();

const els = {
  textStream: document.getElementById('text-stream'),
  dateDisplay: document.getElementById('date-display'),
  btnPause: document.getElementById('btn-pause'),
  stability: document.getElementById('stability'),
  tension: document.getElementById('tension'),
  warSupport: document.getElementById('war-support'),
  politicalPower: document.getElementById('political-power'),
  location: document.getElementById('location'),
  eventPrompt: document.getElementById('event-prompt'),
  eventText: document.getElementById('event-text'),
  eventChoices: document.getElementById('event-choices'),
};

const output = createOutput(els.textStream);
const notebook = createNotebook();

function updateHUD() {
  els.dateDisplay.textContent = formatDateCN(state.date);
  els.stability.textContent = state.stability;
  els.tension.textContent = state.tension;
  if (els.warSupport) els.warSupport.textContent = state.warSupport;
  if (els.politicalPower) els.politicalPower.textContent = state.politicalPower;
  if (els.location) els.location.textContent = LOCATION_NAMES[state.location] || state.location;
}

function setPaused(paused) {
  state.paused = paused;
  els.btnPause.textContent = paused ? '▶' : '⏸';
  els.btnPause.classList.toggle('paused', paused);
  els.btnPause.title = paused ? '继续' : '暂停';
}

const eventUI = createEventUI({
  promptEl: els.eventPrompt,
  textEl: els.eventText,
  choicesEl: els.eventChoices,
  output,
  notebook,
  onPause: setPaused,
});

const dayCycle = createDayCycle({
  data: dailyEvents,
  state,
  output,
  notebook,
  eventUI,
  onPause: setPaused,
});

let lastTick = 0;
const MS_PER_DAY = { 1: 1200, 3: 400, 5: 120 };

function tick() {
  if (state.paused || state.awaitingChoice) return;
  state.date.setDate(state.date.getDate() + 1);
  updateHUD();
  dayCycle.processDayEnd();
  updateHUD();
}

function gameLoop(timestamp) {
  if (!state.paused && !state.awaitingChoice && timestamp - lastTick >= MS_PER_DAY[state.speed]) {
    tick();
    lastTick = timestamp;
  }
  requestAnimationFrame(gameLoop);
}

els.btnPause.addEventListener('click', () => {
  if (!state.awaitingChoice) setPaused(!state.paused);
});

document.querySelectorAll('.speed-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.speed = Number(btn.dataset.speed);
    state.quietBuffer = 0;
  });
});

function showOpening() {
  els.textStream.innerHTML = '';
  output.appendNarrative([
    '我醒来时，窗外柏林的天空是铅灰色的。',
    '新年。帝国的第三年——不，用我们的说法，是民族觉醒后的第三年。',
  ]);
  output.append('[SYS] 日期: 1936-01-01 | 稳定度: 75 | 战争支持度: 30', 'sys');
  output.append('[DIP] 奥地利: 关系 55 | 捷克斯洛伐克: 关系 10 | 法国: 关系 -40', 'dip');
  output.append('[FOC] 国策树尚未实装。日常接见与日循环已启用。', 'foc');
  output.append('[EVT] 游戏已自动暂停。点击 ▶ 让时间开始流逝。', 'evt');
  notebook.add('focus', '待选首个国策', '1936-01-01');
  notebook.add('diplomacy', '法国: -40 | 奥地利: 55', '1936-01-01');
}

notebook.bindCells();
updateHUD();
showOpening();
requestAnimationFrame(gameLoop);
