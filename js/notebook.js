const MAX_ENTRIES = 20;

const LOG_IDS = {
  focus: 'notebook-focus-log',
  diplomacy: 'notebook-diplomacy-log',
  intel: 'notebook-intel-log',
};

export function createNotebook() {
  const data = { focus: [], diplomacy: [], intel: [] };

  const previews = {
    focus: document.getElementById('cell-focus'),
    diplomacy: document.getElementById('cell-diplomacy'),
    intel: document.getElementById('cell-intel'),
  };

  function renderLog(type) {
    const el = document.getElementById(LOG_IDS[type]);
    if (!el) return;
    const items = data[type];
    if (!items.length) {
      el.innerHTML = '<p class="notebook-empty">（暂无记录）</p>';
      return;
    }
    el.innerHTML = items.map((e) => `<p class="notebook-entry">${escapeHtml(e)}</p>`).join('');
  }

  function add(type, text, dateStr) {
    if (!data[type]) return;
    const entry = `[${dateStr}] ${text}`;
    data[type].unshift(entry);
    if (data[type].length > MAX_ENTRIES) data[type].pop();
    if (previews[type]) previews[type].textContent = text;
    renderLog(type);
  }

  function bindSubMenus() {
    document.querySelectorAll('[data-sub-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const map = { 'focus-log': 'focus', 'dip-log': 'diplomacy', 'intel-log': 'intel' };
        const type = map[btn.dataset.subOpen];
        if (type) renderLog(type);
      });
    });
  }

  return { add, bindSubMenus, renderLog, data };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
