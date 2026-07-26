const LOG_PREFIX = /^\[(SYS|DIP|FOC|EVT)\]/;

/** 状态栏已展示的数据，不再写入调试台/通知 */
const STAT_NOISE = /^(稳定|战争支持|政治权力|紧张度|工厂|驻地)\s/;
const STAT_SUMMARY = /^\d{4}-\d{2}-\d{2}\s+稳\d+/;

export function shouldSkipLog(text) {
  if (!LOG_PREFIX.test(text)) return true;
  const body = text.replace(/^\[\w+\]\s*/, '');
  if (STAT_SUMMARY.test(body)) return true;
  const parts = body.split(/\s*\|\s*/).map((p) => p.trim());
  if (parts.length > 0 && parts.every((p) => STAT_NOISE.test(p))) return true;
  return false;
}

export function createOutput(streamEl, onNotify) {
  function append(text, className = '') {
    if (!LOG_PREFIX.test(text) || shouldSkipLog(text)) return;

    const p = document.createElement('p');
    p.className = className || 'sys';
    p.textContent = text;
    streamEl.appendChild(p);
    streamEl.scrollTop = streamEl.scrollHeight;

    if (onNotify) onNotify(text, className);
  }

  function appendNarrative() {}

  return { append, appendNarrative };
}

export function renderModalNarrative(container, lines) {
  if (!container) return;
  const arr = Array.isArray(lines) ? lines : [lines];
  container.innerHTML = arr.map((l) => `<p>${escapeHtml(l)}</p>`).join('');
  container.hidden = arr.length === 0;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
