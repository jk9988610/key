export function createOutput(streamEl) {
  function append(text, className = '') {
    const p = document.createElement('p');
    if (className) p.className = className;
    p.textContent = text;
    streamEl.appendChild(p);
    streamEl.scrollTop = streamEl.scrollHeight;
  }

  function appendNarrative(lines) {
    const arr = Array.isArray(lines) ? lines : [lines];
    arr.forEach((l) => append(l, 'narrative'));
  }

  return { append, appendNarrative };
}
