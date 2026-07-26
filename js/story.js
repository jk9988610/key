import { checkConditions } from './conditions.js';
import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';
import storyData from './data/story_events.js';

export function createStorySystem({ state, output, notebook, eventUI, onHUDUpdate }) {
  const fired = new Set();

  function tryTrigger(id) {
    if (fired.has(id)) return false;
    const def = storyData[id];
    if (!def) return false;
    fired.add(id);

    if (def.choices?.length === 1 && !def.critical) {
      applyEffects(state, def.choices[0].effects || {}, { flags: def.choices[0].flags });
      onHUDUpdate?.();
      return true;
    }

    eventUI.showChoiceEvent({
      narrative: def.narrative,
      promptText: def.critical ? '重大事件' : undefined,
      choices: (def.choices || []).map((c) => ({
        text: c.text,
        effects: c.effects || {},
        flags: c.flags,
      })),
    }, state);
    return true;
  }

  function onFocusComplete(focusId, storyId) {
    if (storyId) tryTrigger(storyId);
  }

  function checkHistoricalStory(storyId) {
    if (storyId) tryTrigger(storyId);
  }

  return { tryTrigger, onFocusComplete, checkHistoricalStory, fired };
}
