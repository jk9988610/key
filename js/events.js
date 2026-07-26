import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';
import { renderModalNarrative } from './consoleOutput.js';

export function createEventUI({
  modalEl,
  modalNarrative,
  promptEl,
  textEl,
  choicesEl,
  output,
  notebook,
  onPause,
  onResume,
  onChoiceComplete,
}) {
  function showModal(show) {
    if (modalEl) modalEl.hidden = !show;
  }

  function showChoiceEvent(eventDef, state) {
    state.wasRunningBeforeEvent = !state.paused;
    state.awaitingChoice = true;
    onPause?.(true);

    renderModalNarrative(modalNarrative, eventDef.narrative || []);
    showModal(true);

    if (eventDef.character) {
      textEl.textContent = `${eventDef.character}求见`;
    } else {
      textEl.textContent = eventDef.promptText || '请做出决定';
    }

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
          if (nb) notebook.add(nb.type, nb.text, formatDateISO(state.date));
        }

        showModal(false);
        modalNarrative.innerHTML = '';
        state.awaitingChoice = false;
        onChoiceComplete?.();

        if (state.wasRunningBeforeEvent) onResume?.();
      });
      choicesEl.appendChild(btn);
    });
  }

  return { showChoiceEvent };
}

export function applyPassiveEvent(eventDef, state, output, notebook) {
  const { logs, notebook: nb } = applyEffects(state, eventDef.effects || {});
  if (eventDef.notebook) notebook.add(eventDef.notebook.type, eventDef.notebook.text, formatDateISO(state.date));
  if (nb) notebook.add(nb.type, nb.text, formatDateISO(state.date));
  logs.forEach((line) => output.append(`[SYS] ${line}`, 'sys'));
}
