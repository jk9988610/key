import { checkConditions } from './conditions.js';
import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';
import script from './data/historical_script.js';

export function createAIScript({ state, notebook, storySystem }) {
  const processed = new Set();

  function tick() {
    const today = formatDateISO(state.date);
    for (const node of script) {
      if (processed.has(node.id)) continue;
      if (node.date > today) continue;
      if (node.date < today) {
        processed.add(node.id);
        continue;
      }
      if (node.skipIf && checkConditions(node.skipIf, state)) {
        processed.add(node.id);
        continue;
      }

      processed.add(node.id);

      if (node.effects) applyEffects(state, node.effects);
      if (node.notebook) notebook.add(node.notebook.type, node.notebook.text, today);
      if (node.story) storySystem.checkHistoricalStory(node.story);
    }
  }

  return { tick };
}
