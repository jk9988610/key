import { checkConditions } from './conditions.js';
import { applyEffects } from './effects.js';
import { formatDateISO } from './state.js';
import focusData, { STARTER_FOCUS_IDS } from './data/focuses.js';

export function createFocusSystem({ state, output, notebook, onMapUpdate, onHUDUpdate, eventUI }) {
  const completed = new Set();

  function getDef(id) {
    return focusData[id];
  }

  function canStart(id) {
    if (state.focusActive || completed.has(id)) return { ok: false, reason: '不可重复或已有进行中国策' };
    const def = getDef(id);
    if (!def) return { ok: false, reason: '未知国策' };
    if (state.politicalPower < def.cost) return { ok: false, reason: `政治权力不足（需要 ${def.cost}）` };
    if (def.requires?.length && !def.requires.every((r) => completed.has(r))) {
      return { ok: false, reason: '前置国策未完成' };
    }
    if (def.conditions && !checkConditions(def.conditions, state)) {
      return { ok: false, reason: '条件未满足' };
    }
    return { ok: true };
  }

  function getAvailable() {
    return Object.keys(focusData).filter((id) => {
      if (completed.has(id)) return false;
      if (state.focusActive === id) return false;
      const def = getDef(id);
      if (def.requires?.length && !def.requires.every((r) => completed.has(r))) return false;
      return true;
    });
  }

  function startFocus(id, silent = false) {
    const check = canStart(id);
    if (!check.ok) {
      if (!silent) output.append(`[FOC] 无法启动「${getDef(id)?.name}」：${check.reason}`, 'foc');
      return false;
    }
    const def = getDef(id);
    state.politicalPower -= def.cost;
    state.focusActive = id;
    state.focusProgress = 0;
    if (!silent) {
      output.append(`[FOC] 国策启动：${def.name}（${def.days} 日）`, 'foc');
      output.appendNarrative([`「${def.name}」的方案摆上桌面。`, def.desc]);
      notebook.add('focus', `进行中: ${def.name} 0/${def.days}`, formatDateISO(state.date));
    }
    onHUDUpdate?.();
    renderPanel();
    return true;
  }

  function applyDailyFocusEffects() {
    if (!state.focusActive) return;
    const def = getDef(state.focusActive);
    if (def?.dailyEffects) applyEffects(state, def.dailyEffects);
  }

  function tickFocus() {
    if (!state.focusActive) return;
    const def = getDef(state.focusActive);
    if (!def) return;
    if (state.focusProgress >= def.days) completeFocus();
    else renderPanel();
  }

  function completeFocus() {
    const id = state.focusActive;
    const def = getDef(id);
    if (!def) return;

    state.focusActive = null;
    state.focusProgress = 0;
    completed.add(id);

    if (def.effects || def.flags) {
      applyEffects(state, def.effects || {}, { flags: def.flags });
    }

    output.appendNarrative(def.completeNarrative || [`「${def.name}」完成了。`]);
    output.append(`[FOC] 国策完成：${def.name}`, 'foc');
    if (def.notebook) notebook.add('focus', def.notebook, formatDateISO(state.date));

    onMapUpdate?.();
    onHUDUpdate?.();
    renderPanel();
  }

  function showStarterChoice() {
    const starters = STARTER_FOCUS_IDS.map((id) => getDef(id));
    eventUI.showChoiceEvent({
      narrative: [
        '里宾特洛甫把一份名单放在我桌上。',
        '「元首，今年的国策，您想从哪里开始？」',
      ],
      promptText: '选择首个国策：',
      choices: starters.map((def) => ({
        text: `${def.name}（${def.days}日 / ${def.cost}政治权力）`,
        onSelect: () => startFocus(def.id, true),
      })),
    }, state);
  }

  const progressEl = document.getElementById('focus-progress');
  const listEl = document.getElementById('focus-list');

  function renderPanel() {
    if (!listEl) return;

    if (state.focusActive) {
      const def = getDef(state.focusActive);
      const pct = Math.min(100, Math.round((state.focusProgress / def.days) * 100));
      if (progressEl) {
        progressEl.hidden = false;
        progressEl.innerHTML = `
          <div class="focus-active-name">${def.name}</div>
          <div class="focus-bar"><div class="focus-bar-fill" style="width:${pct}%"></div></div>
          <div class="focus-active-meta">${state.focusProgress}/${def.days} 日</div>
        `;
      }
      listEl.innerHTML = '';
      return;
    }

    if (progressEl) progressEl.hidden = true;

    const available = getAvailable();
    listEl.innerHTML = available.map((id) => {
      const def = getDef(id);
      const check = canStart(id);
      const disabled = check.ok ? '' : 'disabled';
      return `<button type="button" class="focus-start-btn" data-focus="${id}" ${disabled} title="${check.ok ? def.desc : check.reason}">${def.name}<span class="focus-cost">${def.cost}·${def.days}日</span></button>`;
    }).join('') || '<p class="focus-empty">暂无可选国策</p>';

    listEl.querySelectorAll('.focus-start-btn:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => startFocus(btn.dataset.focus));
    });
  }

  return {
    startFocus,
    applyDailyFocusEffects,
    tickFocus,
    showStarterChoice,
    renderPanel,
    getAvailable,
    completed,
  };
}
