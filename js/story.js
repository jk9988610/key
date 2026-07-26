import { checkConditions } from './conditions.js';
import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';
import storyData from './data/story_events.js';

const STORY_APP = {
  STORY_RHINELAND_FALLOUT: 'focus',
  STORY_SCHUSCHNIG: 'diplomacy',
  STORY_ANNEX_AUSTRIA: 'diplomacy',
  STORY_MUNICH: 'diplomacy',
  STORY_PRAGUE: 'diplomacy',
  STORY_ANTI_COMINTERN: 'diplomacy',
};

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

    const appId = def.appId || STORY_APP[id] || 'audience';
    eventUI.enqueueChoice({
      appId,
      title: def.critical ? '重大事件' : '新消息',
      preview: def.narrative?.[0] || '',
      narrative: def.narrative,
      promptText: def.critical ? '重大事件' : '请做出决定',
      critical: def.critical,
      deadlineDays: def.deadlineDays ?? (def.critical ? 21 : 14),
      choices: (def.choices || []).map((c) => ({
        text: c.text,
        effects: c.effects || {},
        flags: c.flags,
      })),
    });
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
