import {
  checkConditions,
  filterByConditions,
  pickFromMix,
  pickRandom,
  pickWeighted,
  rollSchedule,
} from './conditions.js';
import { applyPassiveEvent } from './events.js';
import { dailyTick, sysStatusLine } from './effects.js';
import { formatDateISO, LOCATION_NAMES } from './state.js';

export function createDayCycle({ data, state, output, notebook, eventUI, onPause }) {
  function processDayEnd() {
    if (state.awaitingChoice) return;

    dailyTick(state);

    const schedule = rollSchedule(data.scheduleWeights);

    if (state.speed >= 5 && schedule === 'quiet') {
      state.quietBuffer += 1;
      if (state.quietBuffer < 7) return;
      state.quietBuffer = 0;
      output.append('[SYS] 过去七日无大事。国策与政务在后台推进。', 'sys');
      output.append(sysStatusLine(state), 'sys');
      return;
    }

    state.quietBuffer = 0;

    switch (schedule) {
      case 'quiet':
        handleQuiet();
        break;
      case 'routine':
        handleRoutine();
        break;
      case 'decision':
        handleDecision();
        break;
      case 'travel':
        handleTravel();
        break;
      default:
        handleQuiet();
    }

    if (state.location !== 'berlin' && Math.random() < 0.15) {
      output.append(`[现场] 今日在${LOCATION_NAMES[state.location] || state.location}办公。`, 'narrative');
    }
  }

  function handleQuiet() {
    const q = pickRandom(data.quiet);
    if (q) output.append(q.text, 'narrative');
    output.append(sysStatusLine(state), 'sys');
  }

  function handleRoutine() {
    const buckets = {
      telegram: data.telegrams,
      briefing: data.briefings,
      desk: data.desk,
    };
    const item = pickFromMix(data.routineMix, buckets, state);

    if (!item) {
      handleQuiet();
      return;
    }

    if (item.text) {
      applyPassiveEvent(item, state, output, notebook);
      output.append('[DIP] 电报已归档', 'dip');
    } else if (item.sys) {
      applyPassiveEvent(item, state, output, notebook);
      output.append('[简报] 军事简报已记录', 'brief');
    } else if (item.choices) {
      eventUI.showChoiceEvent(item, state, () => onPause?.(true));
      return;
    }

    output.append(sysStatusLine(state), 'sys');
  }

  function handleDecision() {
    const buckets = {
      audience: data.audiences,
      lunch: data.lunches,
      desk: data.desk,
    };
    const item = pickFromMix(data.decisionMix, buckets, state);

    if (!item) {
      handleRoutine();
      return;
    }

    if (item.choices) {
      const enriched = { ...item };
      if (item.character) {
        enriched.narrative = [
          ...(item.narrative || []),
        ];
      }
      eventUI.showChoiceEvent(enriched, state, () => onPause?.(true));
      output.append('[EVT] 抉择日 — 游戏已自动暂停', 'evt');
      return;
    }

    handleRoutine();
  }

  function handleTravel() {
    const pool = filterByConditions(data.travel, state);
    const item = pool.length ? pickRandom(pool) : null;

    if (!item) {
      handleDecision();
      return;
    }

    eventUI.showChoiceEvent(
      {
        ...item,
        narrative: [
          ...(item.narrative || []),
          `目的地：${item.destination}`,
        ],
      },
      state,
      () => onPause?.(true),
    );
    output.append('[EVT] 出行提议 — 游戏已自动暂停', 'evt');
  }

  return { processDayEnd };
}
