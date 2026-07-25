import { dailyTick } from './effects.js';
import { formatDateISO } from './state.js';

/** 环境描写（低频率随机插入，不暂停） */
const AMBIENT = [
  '窗外柏林的天空灰白。',
  '戈培尔的简报在桌上。我没翻开。',
  '听了一会儿瓦格纳。',
  '无人求见。正合我意。',
];

/**
 * 日循环 — 主动为主：
 * - 默认静默推进（无文本）
 * - 高速时每 14 日一条周摘要
 * - 极低概率环境描写
 * - 剧情/AI 由外部模块驱动
 */
export function createDayCycle({ state, output, focusSystem, aiScript, storySystem }) {
  let daysSilent = 0;

  function processDayEnd() {
    if (state.awaitingChoice) return;

    dailyTick(state);
    focusSystem?.applyDailyFocusEffects();
    const completedFocus = focusSystem?.tickFocus();

    aiScript?.tick();

    daysSilent += 1;

    // 国策完成时的叙事已在 focus 模块输出，此处不重复
    if (completedFocus) {
      daysSilent = 0;
      return;
    }

    // 高速模式：每 14 日一条摘要
    if (state.speed >= 3 && daysSilent >= 14) {
      daysSilent = 0;
      output.append(
        `[SYS] ${formatDateISO(state.date)} | 稳定${state.stability} | 政${state.politicalPower} | 紧张${state.tension}%`,
        'sys',
      );
      return;
    }

    // 常速以下：约 5% 概率一句环境描写（不暂停）
    if (state.speed <= 1 && Math.random() < 0.05) {
      const line = AMBIENT[Math.floor(Math.random() * AMBIENT.length)];
      output.append(line, 'narrative');
      daysSilent = 0;
    }
  }

  return { processDayEnd };
}
