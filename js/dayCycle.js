import { dailyTick } from './effects.js';
import { formatDateISO } from './state.js';

/**
 * 日循环 — 静默推进，仅输出结构化摘要
 */
export function createDayCycle({ state, output, focusSystem, aiScript }) {
  let daysSilent = 0;

  function processDayEnd() {
    if (state.awaitingChoice) return;

    dailyTick(state);
    focusSystem?.applyDailyFocusEffects();
    const completedFocus = focusSystem?.tickFocus();

    aiScript?.tick();
    daysSilent += 1;

    if (completedFocus) {
      daysSilent = 0;
      return;
    }

    if (state.speedLevel >= 3 && daysSilent >= 14) {
      daysSilent = 0;
      output.append(
        `[SYS] ${formatDateISO(state.date)} 稳${state.stability} 政${state.politicalPower} 紧张${state.tension}%`,
        'sys',
      );
    }
  }

  return { processDayEnd };
}
