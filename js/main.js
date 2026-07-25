import dailyEvents from './data/daily_events.js';
import { createDayCycle } from './dayCycle.js';
import { createOutput } from './consoleOutput.js';
import { createEventUI } from './events.js';
import { createMap } from './map.js';
import { createNotebook } from './notebook.js';
import { createInitialState, formatDateCN, LOCATION_NAMES } from './state.js';

const state = createInitialState();

const els = {
  textStream: document.getElementById('text-stream'),
  dateDisplay: document.getElementById('date-display'),
  btnPause: document.getElementById('btn-pause'),
  btnMap: document.getElementById('btn-map'),
  btnMapClose: document.getElementById('btn-map-close'),
  stability: document.getElementById('stability'),
  tension: document.getElementById('tension'),
  warSupport: document.getElementById('war-support'),
  politicalPower: document.getElementById('political-power'),
  location: document.getElementById('location'),
  eventPrompt: document.getElementById('event-prompt'),
  eventText: document.getElementById('event-text'),
  eventChoices: document.getElementById('event-choices'),
  mapOverlay: document.getElementById('map-overlay'),
  strategicMap: document.getElementById('strategic-map'),
  mapInfo: document.getElementById('map-info'),
};

const output = createOutput(els.textStream);
const notebook = createNotebook();

function updateHUD() {
  els.dateDisplay.textContent = formatDateCN(state.date);
  els.stability.textContent = state.stability;
  els.tension.textContent = state.tension;
  els.warSupport.textContent = state.warSupport;
  els.politicalPower.textContent = state.politicalPower;
  const loc = LOCATION_NAMES[state.location] || state.location;
  els.location.textContent = loc.replace('总理府', '').replace('贝希特斯加登', '贝希特');
}

function setPaused(paused) {
  state.paused = paused;
  els.btnPause.textContent = paused ? '▶' : '⏸';
  els.btnPause.classList.toggle('paused', paused);
  els.btnPause.title = paused ? '继续' : '暂停';
}

function resumeAfterChoice() {
  if (state.autoPauseOnEvent) {
    setPaused(false);
  }
}

const map = createMap({
  overlayEl: els.mapOverlay,
  svgEl: els.strategicMap,
  infoEl: els.mapInfo,
  state,
});

const eventUI = createEventUI({
  promptEl: els.eventPrompt,
  textEl: els.eventText,
  choicesEl: els.eventChoices,
  output,
  notebook,
  onPause: setPaused,
  onResume: resumeAfterChoice,
  onChoiceComplete: () => {
    updateHUD();
    map.render();
  },
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

els.btnMap.addEventListener('click', () => map.open());
els.btnMapClose.addEventListener('click', () => map.close());
els.mapOverlay.addEventListener('click', (e) => {
  if (e.target === els.mapOverlay) map.close();
});

function showOpening() {
  output.appendNarrative([
    '我醒来时，窗外柏林的天空是铅灰色的。',
    '新年。帝国的第三年——不，用我们的说法，是民族觉醒后的第三年。',
  ]);
  output.append('[SYS] 日期: 1936-01-01 | 稳定度: 75 | 战争支持度: 30', 'sys');
  output.append('[DIP] 奥地利: 关系 55 | 捷克斯洛伐克: 关系 10 | 法国: 关系 -40', 'dip');
  output.append('[FOC] 国策树尚未实装。日常接见与日循环已启用。', 'foc');
  output.append('[EVT] 游戏已暂停。点击 ▶ 开始。', 'evt');
  notebook.add('focus', '待选首个国策', '1936-01-01');
  notebook.add('diplomacy', '法国: -40 | 奥地利: 55', '1936-01-01');
}

notebook.bindCells();
updateHUD();
showOpening();
requestAnimationFrame(gameLoop);
