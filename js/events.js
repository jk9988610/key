import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';

export function createEventUI({ promptEl, textEl, choicesEl, output, notebook, onPause }) {
  function showChoiceEvent(eventDef, state, onDone) {
    state.awaitingChoice = true;
    if (onPause) onPause(true);

    const lines = eventDef.narrative || [];
    output.appendNarrative(lines);

    if (eventDef.character) {
      output.append(`[简报] ${eventDef.character}求见`, 'brief');
    }

    promptEl.hidden = false;
    textEl.textContent = '请做出决定：';
    choicesEl.innerHTML = '';

    (eventDef.choices || []).forEach((choice) => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        const { logs, notebook: nb } = applyEffects(state, choice.effects, {
          trust: choice.trust,
          flags: choice.flags,
          notebook: choice.notebook,
        });

        if (logs.length) {
          output.append(`[SYS] ${logs.join(' | ')}`, 'sys');
        }
        if (nb) {
          notebook.add(nb.type, nb.text, formatDateISO(state.date));
        }

        promptEl.hidden = true;
        state.awaitingChoice = false;
        output.append('[EVT] 事件已处理。点击 ▶ 继续时间流逝。', 'evt');
        onDone?.();
      });
      choicesEl.appendChild(btn);
    });
  }

  return { showChoiceEvent };
}

export function applyPassiveEvent(eventDef, state, output, notebook) {
  if (eventDef.text) {
    output.append(eventDef.text, 'narrative');
  }
  if (eventDef.narrative && typeof eventDef.narrative === 'string') {
    output.append(eventDef.narrative, 'brief');
  }
  if (eventDef.sys) {
    output.append(`[SYS] ${eventDef.sys}`, 'sys');
  }

  const { logs, notebook: nb } = applyEffects(state, eventDef.effects || {});
  if (logs.length) output.append(`[SYS] ${logs.join(' | ')}`, 'sys');
  if (eventDef.notebook) notebook.add(eventDef.notebook.type, eventDef.notebook.text, formatDateISO(state.date));
  if (nb) notebook.add(nb.type, nb.text, formatDateISO(state.date));
}
