import dailyEvents from './data/daily_events.js';
import { createDayCycle } from './dayCycle.js';
import { createOutput } from './consoleOutput.js';
import { createEventUI } from './events.js';
import { createFocusSystem } from './focus.js';
import { createNotebook } from './notebook.js';
import { createStorySystem } from './story.js';
import { createAIScript } from './ai.js';
import { createActionSystem } from './actions.js';
import { createShell } from './shell.js';
import { createNotifications } from './notifications.js';
import { createPendingQueue } from './pending.js';
import { createInitialState, formatDateTimeHUD, LOCATION_NAMES } from './state.js';
import { getSpeedConfig, stepSpeedLevel } from './speed.js';
import { VERSION } from './version.js';

const state = createInitialState();

const els = {
  textStream: document.getElementById('text-stream'),
  dateDisplay: document.getElementById('date-display'),
  btnSpeedToggle: document.getElementById('btn-speed-toggle'),
  btnSpeedUp: document.getElementById('btn-speed-up'),
  btnSpeedDown: document.getElementById('btn-speed-down'),
  stability: document.getElementById('stability'),
  tension: document.getElementById('tension'),
  warSupport: document.getElementById('war-support'),
  politicalPower: document.getElementById('political-power'),
  location: document.getElementById('location'),
  phoneModal: document.getElementById('phone-modal'),
  modalNarrative: document.getElementById('modal-narrative'),
  eventPrompt: document.getElementById('event-text'),
  eventText: document.getElementById('event-text'),
  eventChoices: document.getElementById('event-choices'),
  consoleVersion: document.getElementById('console-version'),
};

const shell = createShell();
const notebook = createNotebook();

let eventUI;
let notifications;
let pending;

pending = createPendingQueue({
  getGameDate: () => state.date,
  onChange: (item) => {
    notifications?.onPendingChange(item);
    eventUI?.renderAllPending();
  },
});

notifications = createNotifications({
  listEl: document.getElementById('notif-list'),
  statusIconsEl: document.getElementById('status-app-icons'),
  shadeIconsEl: document.getElementById('shade-app-icons'),
  onOpenApp: (appId, pendingId) => {
    shell.openApp(appId);
    eventUI?.renderAllPending();
    if (pendingId) eventUI?.openPending(pendingId, state);
  },
  pending,
});

const output = createOutput(els.textStream, (text) => notifications.add(text));

function updateSpeedUI() {
  const cfg = getSpeedConfig(state.speedLevel);
  if (els.btnSpeedToggle) {
    els.btnSpeedToggle.textContent = cfg.label;
    els.btnSpeedToggle.classList.toggle('is-paused', state.paused);
    els.btnSpeedToggle.classList.toggle('speed-4', !state.paused && state.speedLevel === 4);
  }
  if (els.btnSpeedDown) els.btnSpeedDown.disabled = state.speedLevel <= 1;
  if (els.btnSpeedUp) els.btnSpeedUp.disabled = state.speedLevel >= 4;
}

function updateHUD() {
  if (els.dateDisplay) els.dateDisplay.textContent = formatDateTimeHUD(state.date);
  els.stability.textContent = state.stability;
  els.tension.textContent = state.tension;
  els.warSupport.textContent = state.warSupport;
  els.politicalPower.textContent = state.politicalPower;
  const loc = LOCATION_NAMES[state.location] || state.location;
  els.location.textContent = loc.replace('总理府', '').replace('贝希特斯加登', '贝希特');
  updateSpeedUI();
}

function setPaused(paused) {
  state.paused = paused;
  updateSpeedUI();
  if (!paused) lastTick = performance.now();
}

function togglePause() {
  if (state.awaitingChoice) return;
  setPaused(!state.paused);
}

function changeSpeed(delta) {
  if (state.awaitingChoice) return;
  state.speedLevel = stepSpeedLevel(state.speedLevel, delta);
  updateSpeedUI();
  if (!state.paused) lastTick = performance.now();
}

eventUI = createEventUI({
  modalEl: els.phoneModal,
  modalNarrative: els.modalNarrative,
  promptEl: els.eventPrompt,
  textEl: els.eventText,
  choicesEl: els.eventChoices,
  output,
  notebook,
  pending,
  getState: () => state,
  onPause: () => setPaused(true),
  onResume: () => {
    state.paused = false;
    updateSpeedUI();
    lastTick = performance.now();
  },
  onChoiceComplete: () => {
    updateHUD();
    focusSystem.renderPanel();
    eventUI.renderAllPending();
    notifications.render();
  },
  onModalChange: () => shell.refreshUI?.(),
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
  onFocusProgress: (p) => notifications.setFocusProgress(p),
  eventUI,
  storySystem,
});

const aiScript = createAIScript({ state, notebook, storySystem });

const dayCycle = createDayCycle({
  state,
  focusSystem,
  aiScript,
});

const actions = createActionSystem({ state, output, eventUI, onHUDUpdate: updateHUD });

let lastTick = performance.now();

function tickHour() {
  if (state.paused || state.awaitingChoice) return;

  state.date.setHours(state.date.getHours() + 1);
  updateHUD();

  if (state.date.getHours() === 0) {
    dayCycle.processDayEnd();
    updateHUD();
    focusSystem.renderPanel();
    eventUI.renderAllPending();
  }
}

function gameLoop(timestamp) {
  if (!state.paused && !state.awaitingChoice) {
    const cfg = getSpeedConfig(state.speedLevel);
    if (timestamp - lastTick >= cfg.msPerHour) {
      tickHour();
      lastTick = timestamp;
    }
  }
  requestAnimationFrame(gameLoop);
}

els.btnSpeedToggle?.addEventListener('click', togglePause);
els.btnSpeedUp?.addEventListener('click', () => changeSpeed(1));
els.btnSpeedDown?.addEventListener('click', () => changeSpeed(-1));

function showOpening() {
  notebook.add('diplomacy', '法国:-40 奥地利:55', '1936-01-01');
}

notebook.bindSubMenus();
actions.bind();
focusSystem.renderPanel();
updateHUD();

if (els.textStream) els.textStream.innerHTML = '';
if (els.consoleVersion) els.consoleVersion.textContent = VERSION;
output.append(`[SYS] 元首办公室 ${VERSION} 已就绪`, 'sys');

shell.showHome();

window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  shell.showHome();
  if (els.textStream) {
    els.textStream.innerHTML = '';
    output.append(`[SYS] 元首办公室 ${VERSION} 已就绪`, 'sys');
  }
});

showOpening();
focusSystem.showStarterChoice();
eventUI.renderAllPending();
notifications.renderStatusIcons();
notifications.renderShadeIcons();
requestAnimationFrame(gameLoop);
