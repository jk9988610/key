const MAX_ENTRIES = 20;

export function createNotebook() {
  const data = {
    focus: [],
    diplomacy: [],
    intel: [],
  };

  const previews = {
    focus: document.getElementById('cell-focus'),
    diplomacy: document.getElementById('cell-diplomacy'),
    intel: document.getElementById('cell-intel'),
  };

  const detail = document.getElementById('notebook-detail');
  const detailTitle = document.getElementById('notebook-detail-title');
  const detailBody = document.getElementById('notebook-detail-body');

  function add(type, text, dateStr) {
    if (!data[type]) return;
    const entry = `[${dateStr}] ${text}`;
    data[type].unshift(entry);
    if (data[type].length > MAX_ENTRIES) data[type].pop();
    if (previews[type]) previews[type].textContent = text;
  }

  function renderDetail(type) {
    const labels = { focus: '国策', diplomacy: '外交', intel: '情报' };
    if (detailTitle) detailTitle.textContent = labels[type] || type;
    const items = data[type];
    if (!items.length) {
      detailBody.innerHTML = '<p class="notebook-empty">（暂无记录）</p>';
      return;
    }
    detailBody.innerHTML = items.map((e) => `<p class="notebook-entry">${escapeHtml(e)}</p>`).join('');
  }

  function bindCells() {
    document.querySelectorAll('.notebook-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        const type = cell.dataset.type;
        document.querySelectorAll('.notebook-cell').forEach((c) => c.classList.remove('active'));
        cell.classList.add('active');
        detail.hidden = false;
        renderDetail(type);
      });
    });
  }

  return { add, bindCells, data };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
