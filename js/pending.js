import { formatDateISO } from './state.js';

export const TAG_TO_APP = {
  foc: 'focus',
  dip: 'diplomacy',
  evt: 'audience',
  sys: 'intel',
};

export const APP_META = {
  focus: { tag: 'foc', name: '国策', icon: '政', color: 'focus', notifyTag: 'FOC' },
  diplomacy: { tag: 'dip', name: '外交', icon: '外', color: 'dip', notifyTag: 'DIP' },
  audience: { tag: 'evt', name: '事件', icon: '见', color: 'aud', notifyTag: 'EVT' },
  intel: { tag: 'sys', name: '情报', icon: '情', color: 'intel', notifyTag: 'SYS' },
};

let seq = 0;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDeadlineHUD(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function createPendingQueue({ getGameDate, onChange }) {
  const items = [];
  const appRecency = {};

  function bumpApp(appId) {
    appRecency[appId] = Date.now();
  }

  function enqueue(def) {
    const appId = def.appId;
    if (!appId || !APP_META[appId]) return null;

    const gameDate = getGameDate();
    let deadline = def.deadline || null;
    if (!deadline && def.deadlineDays != null) {
      deadline = addDays(gameDate, def.deadlineDays);
    }

    const item = {
      id: `p${++seq}`,
      appId,
      title: def.title || def.promptText || '待处理事项',
      preview: def.preview || def.promptText || def.narrative?.[0] || '',
      narrative: def.narrative || [],
      promptText: def.promptText,
      character: def.character,
      choices: def.choices || [],
      deadline,
      critical: Boolean(def.critical),
      createdAt: Date.now(),
    };

    items.unshift(item);
    bumpApp(appId);
    onChange?.(item);
    return item;
  }

  function remove(id) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const [removed] = items.splice(idx, 1);
    onChange?.();
    return removed;
  }

  function getAll() {
    return [...items];
  }

  function getForApp(appId) {
    return items.filter((i) => i.appId === appId);
  }

  function getAppOrder() {
    const apps = new Set(items.map((i) => i.appId));
    return [...apps].sort((a, b) => (appRecency[b] || 0) - (appRecency[a] || 0));
  }

  function bumpAppRecency(appId) {
    if (!appId) return;
    bumpApp(appId);
    onChange?.();
  }

  function isExpired(item) {
    if (!item?.deadline) return false;
    const today = formatDateISO(getGameDate());
    const dl = formatDateISO(item.deadline instanceof Date ? item.deadline : new Date(item.deadline));
    return today > dl;
  }

  function deadlineLabel(item) {
    if (!item?.deadline) return '';
    const hud = formatDeadlineHUD(item.deadline);
    return isExpired(item) ? `截止 ${hud} · 已过期` : `截止 ${hud}`;
  }

  function notifyText(item) {
    const meta = APP_META[item.appId];
    const dl = deadlineLabel(item);
    const body = dl ? `${item.title} · ${dl}` : item.title;
    return `[${meta.notifyTag}] ${body}`;
  }

  function renderAppList(appId, container, { onOpen }) {
    if (!container) return;
    const list = getForApp(appId);
    if (!list.length) {
      container.innerHTML = '';
      container.hidden = true;
      return;
    }

    container.hidden = false;
    container.innerHTML = `
      <div class="pending-section-title">待处理</div>
      ${list.map((item) => {
        const expired = isExpired(item);
        const dl = deadlineLabel(item);
        return `
          <button type="button" class="pending-card ${item.critical ? 'critical' : ''} ${expired ? 'expired' : ''}" data-pending-id="${item.id}">
            <div class="pending-card-head">
              <span class="pending-card-title">${escapeHtml(item.title)}</span>
              ${item.critical ? '<span class="pending-badge">重要</span>' : ''}
            </div>
            ${dl ? `<span class="pending-deadline">${escapeHtml(dl)}</span>` : ''}
            <span class="pending-preview">${escapeHtml(item.preview)}</span>
          </button>
        `;
      }).join('')}
    `;

    container.querySelectorAll('[data-pending-id]').forEach((btn) => {
      btn.addEventListener('click', () => onOpen?.(btn.dataset.pendingId));
    });
  }

  return {
    enqueue,
    remove,
    getAll,
    getForApp,
    getAppOrder,
    bumpAppRecency,
    isExpired,
    deadlineLabel,
    notifyText,
    renderAppList,
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
