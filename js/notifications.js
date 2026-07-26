/** 通知中心 — 按应用分组，支持国策进度条 */
const NOTIFY_PREFIX = /^\[(SYS|DIP|FOC|EVT)\]/;

const APP_META = {
  sys: { name: '系统', icon: '系', color: 'sys' },
  foc: { name: '国策', icon: '政', color: 'foc' },
  dip: { name: '外交', icon: '外', color: 'dip' },
  evt: { name: '事件', icon: '告', color: 'evt' },
};

export function createNotifications({ listEl }) {
  const groups = {};
  const expanded = new Set();
  let focusProgress = null;
  const MAX_PER_GROUP = 20;

  function ensureGroup(appId) {
    if (!groups[appId]) groups[appId] = [];
    return groups[appId];
  }

  function add(text) {
    if (!NOTIFY_PREFIX.test(text)) return;
    const tag = text.match(/^\[(\w+)\]/)?.[1]?.toLowerCase();
    if (!tag || !APP_META[tag]) return;

    const body = text.replace(/^\[\w+\]\s*/, '');
    ensureGroup(tag).unshift({
      text: body,
      full: text,
      time: formatTime(),
    });
    if (groups[tag].length > MAX_PER_GROUP) groups[tag].pop();
    render();
  }

  function setFocusProgress(data) {
    focusProgress = data;
    render();
  }

  function toggleExpand(appId) {
    if (expanded.has(appId)) expanded.delete(appId);
    else expanded.add(appId);
    render();
  }

  function render() {
    if (!listEl) return;

    const appsWithContent = new Set();
    if (focusProgress) appsWithContent.add('foc');
    Object.keys(groups).forEach((id) => {
      if (groups[id].length) appsWithContent.add(id);
    });

    if (!appsWithContent.size) {
      listEl.innerHTML = '<p class="notif-empty">暂无通知</p>';
      return;
    }

    const order = ['foc', 'evt', 'dip', 'sys'].filter((id) => appsWithContent.has(id));
    listEl.innerHTML = order.map((id) => renderAppCard(id, groups[id] || [])).join('');
    bindCardEvents();
  }

  function renderAppCard(appId, messages) {
    const meta = APP_META[appId];
    const isOpen = expanded.has(appId);
    const showProgress = appId === 'foc' && focusProgress;
    const preview = messages[0]?.text || (showProgress ? focusProgress.title : '');
    const count = messages.length;
    const hasMessages = count > 0;

    let progressHtml = '';
    if (showProgress) {
      const { title, current, total } = focusProgress;
      const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      progressHtml = `
        <div class="notif-progress-wrap">
          <div class="notif-progress-track">
            <div class="notif-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="notif-progress-label">${escapeHtml(title)} · ${current}/${total} 日 · ${pct}%</span>
        </div>
      `;
    }

    const headerTag = hasMessages ? 'button' : 'div';
    const headerAttrs = hasMessages
      ? `type="button" class="notif-app-header" data-toggle="${appId}" aria-expanded="${isOpen}"`
      : 'class="notif-app-header notif-app-header-static"';

    return `
      <div class="notif-app-card" data-app="${appId}">
        <${headerTag} ${headerAttrs}>
          <span class="notif-app-icon app-icon-${meta.color}">${meta.icon}</span>
          <div class="notif-app-summary">
            <span class="notif-app-name">${meta.name}</span>
            ${!showProgress && preview ? `<span class="notif-app-preview">${escapeHtml(preview)}</span>` : ''}
          </div>
          ${hasMessages && count > 1 ? `<span class="notif-app-count">${count}</span>` : ''}
          ${hasMessages ? `<span class="notif-app-chevron ${isOpen ? 'open' : ''}">›</span>` : ''}
        </${headerTag}>
        ${progressHtml}
        ${hasMessages ? `
          <div class="notif-app-body ${isOpen ? 'open' : ''}">
            ${messages.map((m) => `
              <div class="notif-msg">
                <span class="notif-msg-time">${m.time}</span>
                <span class="notif-msg-text">${escapeHtml(m.text)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function bindCardEvents() {
    listEl?.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => toggleExpand(btn.dataset.toggle));
    });
  }

  function clearBadge() {}

  return { add, render, clearBadge, setFocusProgress };
}

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
