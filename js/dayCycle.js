import { dailyTick } from './effects.js';

/**
 * 日循环 — 静默推进，状态已在状态栏显示，不输出摘要
 */
export function createDayCycle({ state, focusSystem, aiScript }) {
  function processDayEnd() {
    if (state.awaitingChoice) return;

    dailyTick(state);
    focusSystem?.applyDailyFocusEffects();
    focusSystem?.tickFocus();
    aiScript?.tick();
  }

  return { processDayEnd };
}
