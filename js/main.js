import dailyEvents from './data/daily_events.js';
import { createDayCycle } from './dayCycle.js';
import { createOutput } from './consoleOutput.js';
import { createEventUI } from './events.js';
import { createFocusSystem } from './focus.js';
import { createMap } from './map.js';
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
  if (!paused) lastTick = performance.now();
}

const map = createMap({ svgEl: els.strategicMap, infoEl: els.mapInfo, state });

const eventUI = createEventUI({
  promptEl: els.eventPrompt,
  textEl: els.eventText,
  choicesEl: els.eventChoices,
  output,
  notebook,
  onPause: setPaused,
  onResume: () => setPaused(false),
  onChoiceComplete: () => {
    updateHUD();
    map.render();
    focusSystem.renderPanel();
  },
});

const focusSystem = createFocusSystem({
  state,
  output,
  notebook,
  onMapUpdate: () => map.render(),
  onHUDUpdate: updateHUD,
  eventUI,
});

const dayCycle = createDayCycle({
  data: dailyEvents,
  state,
  output,
  notebook,
  eventUI,
  focusSystem,
});

let lastTick = performance.now();
const MS_PER_DAY = { 1: 1200, 3: 400, 5: 120 };

function tick() {
  if (state.paused || state.awaitingChoice) return;
  state.date.setDate(state.date.getDate() + 1);
  updateHUD();
  dayCycle.processDayEnd();
  updateHUD();
  focusSystem.renderPanel();
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
  output.appendNarrative([
    '我醒来时，窗外柏林的天空是铅灰色的。',
    '新年。帝国的第三年——不，用我们的说法，是民族觉醒后的第三年。',
  ]);
  output.append('[SYS] 日期: 1936-01-01 | 稳定度: 75 | 战争支持度: 30', 'sys');
  output.append('[DIP] 奥地利: 关系 55 | 捷克斯洛伐克: 关系 10 | 法国: 关系 -40', 'dip');
  notebook.add('diplomacy', '法国: -40 | 奥地利: 55', '1936-01-01');
}

notebook.bindCells();
focusSystem.renderPanel();
updateHUD();
showOpening();
focusSystem.showStarterChoice();
requestAnimationFrame(gameLoop);
