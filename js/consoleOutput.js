const LOG_TYPES = new Set(['sys', 'dip', 'foc', 'evt']);
const LOG_PREFIX = /^\[(SYS|DIP|FOC|EVT)\]/;

export function createOutput(streamEl, onNotify) {
  function append(text, className = '') {
    if (!LOG_PREFIX.test(text)) return;

    const p = document.createElement('p');
    p.className = className || 'sys';
    p.textContent = text;
    streamEl.appendChild(p);
    streamEl.scrollTop = streamEl.scrollHeight;

    if (onNotify) onNotify(text, className);
  }

  /** 叙事文本仅用于手机弹窗，不写入调试台 */
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
