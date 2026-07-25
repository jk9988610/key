const MAX_ENTRIES = 20;

export function createNotebook() {
  const data = {
    focus: [],
    diplomacy: [],
    intel: [],
    memo: [],
  };

  const previews = {
    focus: document.getElementById('cell-focus'),
    diplomacy: document.getElementById('cell-diplomacy'),
    intel: document.getElementById('cell-intel'),
    memo: document.getElementById('cell-memo'),
  };

  const detail = document.getElementById('notebook-detail');

  function add(type, text, dateStr) {
    if (!data[type]) return;
    const entry = `[${dateStr}] ${text}`;
    data[type].unshift(entry);
    if (data[type].length > MAX_ENTRIES) data[type].pop();
    previews[type].textContent = entry;
  }

  function renderDetail(type) {
    const items = data[type];
    if (!items.length) {
      detail.textContent = '（空）';
      return;
    }
    detail.innerHTML = items.map((e) => `<div>${escapeHtml(e)}</div>`).join('');
  }

  function bindCells() {
    document.querySelectorAll('.notebook-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        const type = cell.dataset.type;
        detail.hidden = false;
        if (type === 'memo') {
          detail.innerHTML = `<textarea id="memo-edit" rows="5" style="width:100%">${escapeHtml(data.memo[0] || '')}</textarea>`;
          const ta = document.getElementById('memo-edit');
          ta.addEventListener('change', () => {
            data.memo = [ta.value];
            previews.memo.textContent = ta.value.slice(0, 24) || '点击编辑';
          });
        } else {
          renderDetail(type);
        }
      });
    });
  }

  return { add, bindCells, data };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
