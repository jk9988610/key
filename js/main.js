import dailyEvents from './data/daily_events.js';
import { createDayCycle } from './dayCycle.js';
import { createOutput } from './consoleOutput.js';
import { createEventUI } from './events.js';
import { createFocusSystem } from './focus.js';
import { createNotebook } from './notebook.js';
import { createStorySystem } from './story.js';
import { createAIScript } from './ai.js';
import { createActionSystem } from './actions.js';
import { createShell, createNotifications } from './shell.js';
import { createInitialState, formatDateCN, LOCATION_NAMES } from './state.js';

const state = createInitialState();

const els = {
  textStream: document.getElementById('text-stream'),
  dateDisplay: document.getElementById('date-display'),
  homeDate: document.getElementById('home-date'),
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

const notifications = createNotifications({
  listEl: document.getElementById('notif-list'),
  badgeEl: document.getElementById('notif-badge'),
});

const output = createOutput(els.textStream, (text, type) => notifications.add(text, type));
const notebook = createNotebook();
const shell = createShell();

function updateHUD() {
  const cn = formatDateCN(state.date);
  const short = cn.replace('年', '/').replace('月', '/').replace('日', '');
  els.dateDisplay.textContent = short;
  if (els.homeDate) els.homeDate.textContent = cn;
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
    focusSystem.renderPanel();
  },
});

const storySystem = createStorySystem({
  state,
  output,
  notebook,
  eventUI,
  onHUDUpdate: updateHUD,
});

const focusSystem = createFocusSystem({
  state,
  output,
  notebook,
  onMapUpdate: () => {},
  onHUDUpdate: updateHUD,
  eventUI,
  storySystem,
});

const aiScript = createAIScript({ state, notebook, storySystem });

const dayCycle = createDayCycle({
  state,
  output,
  focusSystem,
  aiScript,
  storySystem,
});

const actions = createActionSystem({ state, output, eventUI, onHUDUpdate: updateHUD });

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
  });
});

function showOpening() {
  output.appendNarrative([
    '我醒来时，窗外柏林的天空是铅灰色的。',
    '新年。1936年。帝国在等我做出选择。',
  ]);
  output.append('[SYS] 点击上方应用操作；讯息在下方滚动', 'sys');
  notebook.add('diplomacy', '法国:-40 奥地利:55', '1936-01-01');
}

notebook.bindSubMenus();
actions.bind();
focusSystem.renderPanel();
updateHUD();
showOpening();
focusSystem.showStarterChoice();
requestAnimationFrame(gameLoop);
