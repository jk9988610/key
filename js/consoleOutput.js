const NOTIFY_TYPES = new Set(['sys', 'dip', 'foc', 'evt', 'brief']);

export function createOutput(streamEl, onNotify) {
  function append(text, className = '') {
    const p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    streamEl.appendChild(p);
    streamEl.scrollTop = streamEl.scrollHeight;

    if (onNotify && className && NOTIFY_TYPES.has(className)) {
      onNotify(text, className);
    }
  }

  function appendNarrative(lines) {
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.forEach((l) => {
      append(l, 'narrative');
      if (onNotify) onNotify(l, 'narrative');
    });
  }

  return { append, appendNarrative };
}
