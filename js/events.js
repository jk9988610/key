import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';

export function createEventUI({ promptEl, textEl, choicesEl, output, notebook, onPause, onResume, onChoiceComplete }) {
  function showChoiceEvent(eventDef, state) {
    state.wasRunningBeforeEvent = !state.paused;
    state.awaitingChoice = true;
    onPause?.(true);

    output.appendNarrative(eventDef.narrative || []);

    if (eventDef.character) {
      output.append(`[简报] ${eventDef.character}求见`, 'brief');
    }

    promptEl.hidden = false;
    textEl.textContent = eventDef.promptText || '请做出决定：';
    choicesEl.innerHTML = '';

    (eventDef.choices || []).forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        if (choice.onSelect) {
          choice.onSelect();
        } else {
          const { logs, notebook: nb } = applyEffects(state, choice.effects || {}, {
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
        }

        promptEl.hidden = true;
        state.awaitingChoice = false;
        onChoiceComplete?.();

        // 事件前若在运行，选择后自动恢复
        if (state.wasRunningBeforeEvent) {
          onResume?.();
        }
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
