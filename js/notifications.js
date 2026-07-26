import { shouldSkipLog } from './consoleOutput.js';
import { APP_META, TAG_TO_APP } from './pending.js';

const NOTIFY_PREFIX = /^\[(SYS|DIP|FOC|EVT)\]/;

const NOTIFY_META = {
  sys: { name: '情报', icon: '情', color: 'intel' },
  foc: { name: '国策', icon: '政', color: 'focus' },
  dip: { name: '外交', icon: '外', color: 'dip' },
  evt: { name: '事件', icon: '见', color: 'aud' },
};

const SWIPE_ACTION_W = 112;
const STATUS_ICON_MAX = 5;
const SHADE_ICON_MAX = 15;

export function createNotifications({ listEl, statusIconsEl, shadeIconsEl, onOpenApp, pending }) {
  const groups = {};
  const expanded = new Set();
  const muted = new Set();
  const activityOrder = [];
  let focusProgress = null;
  let msgIdSeq = 0;
  let revealedRow = null;
  const MAX_PER_GROUP = 20;

  function bumpRecency(tag) {
    const idx = activityOrder.indexOf(tag);
    if (idx !== -1) activityOrder.splice(idx, 1);
    activityOrder.unshift(tag);
    renderStatusIcons();
    renderShadeIcons();
  }

  function ensureGroup(appId) {
    if (!groups[appId]) groups[appId] = [];
    return groups[appId];
  }

  function add(text) {
    if (!NOTIFY_PREFIX.test(text) || shouldSkipLog(text)) return;
    const tag = text.match(/^\[(\w+)\]/)?.[1]?.toLowerCase();
    if (!tag || !NOTIFY_META[tag] || muted.has(tag)) return;

    const body = text.replace(/^\[\w+\]\s*/, '');
    ensureGroup(tag).unshift({
      id: `m${++msgIdSeq}`,
      text: body,
      full: text,
      time: formatTime(),
    });
    if (groups[tag].length > MAX_PER_GROUP) groups[tag].pop();
    bumpRecency(tag);
    render();
  }

  function onPendingChange(item) {
    if (item) {
      add(pending.notifyText(item));
      return;
    }
    renderStatusIcons();
    renderShadeIcons();
    render();
  }

  function setFocusProgress(data) {
    focusProgress = data;
    if (data) bumpRecency('foc');
    render();
  }

  function getOrderedTags() {
    const active = new Set();
    if (focusProgress) active.add('foc');
    Object.keys(groups).forEach((id) => {
      if (groups[id].length) active.add(id);
    });
    pending?.getAppOrder().forEach((appId) => {
      const tag = APP_META[appId]?.tag;
      if (tag) active.add(tag);
    });
    return activityOrder.filter((tag) => active.has(tag));
  }

  function renderIconButtons(container, tags) {
    if (!container) return;
    if (!tags.length) {
      container.innerHTML = '';
      container.hidden = true;
      return;
    }

    container.hidden = false;
    container.innerHTML = tags.map((tag) => {
      const meta = NOTIFY_META[tag];
      const appId = TAG_TO_APP[tag];
      return `
        <button type="button" class="status-app-icon app-icon-${meta.color}" data-app="${appId}" title="${meta.name}">
          ${meta.icon}
        </button>
      `;
    }).join('');

    container.querySelectorAll('[data-app]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onOpenApp?.(btn.dataset.app);
      });
    });
  }

  function renderStatusIcons() {
    renderIconButtons(statusIconsEl, getOrderedTags().slice(0, STATUS_ICON_MAX));
  }

  function renderShadeIcons() {
    renderIconButtons(shadeIconsEl, getOrderedTags().slice(0, SHADE_ICON_MAX));
  }

  function toggleExpand(appId) {
    if (expanded.has(appId)) expanded.delete(appId);
    else expanded.add(appId);
    render();
  }

  function deleteMessage(appId, msgId) {
    if (!groups[appId]) return;
    groups[appId] = groups[appId].filter((m) => m.id !== msgId);
    if (!groups[appId].length) delete groups[appId];
    render();
  }

  function deleteAppGroup(appId) {
    delete groups[appId];
    if (appId === 'foc') focusProgress = null;
    render();
  }

  function toggleMute(appId) {
    if (muted.has(appId)) muted.delete(appId);
    else muted.add(appId);
    render();
  }

  function renderSwipeRow(rowId, innerHtml) {
    return `
      <div class="notif-swipe-row" data-row-id="${rowId}">
        <div class="notif-swipe-actions">
          <button type="button" class="notif-action-btn notif-action-settings" data-settings="${rowId}" title="设置">设置</button>
          <button type="button" class="notif-action-btn notif-action-delete" data-delete="${rowId}" title="删除">删除</button>
        </div>
        <div class="notif-swipe-content">${innerHtml}</div>
      </div>
    `;
  }

  function render() {
    if (!listEl) return;
    revealedRow = null;

    const order = getOrderedTags();

    if (!order.length) {
      listEl.innerHTML = '<p class="notif-empty">暂无通知</p>';
      renderStatusIcons();
      renderShadeIcons();
      return;
    }

    listEl.innerHTML = order.map((tag) => renderAppCard(tag, groups[tag] || [])).join('');
    bindCardEvents();
    bindSwipeRows();
    renderStatusIcons();
    renderShadeIcons();
  }

  function renderAppCard(tag, messages) {
    const meta = NOTIFY_META[tag];
    const appId = TAG_TO_APP[tag];
    const isOpen = expanded.has(tag);
    const showProgress = tag === 'foc' && focusProgress;
    const preview = messages[0]?.text || '';
    const count = messages.length;
    const hasMessages = count > 0;
    const isMuted = muted.has(tag);
    const pendingItems = pending?.getForApp(appId) || [];
    const pendingCount = pendingItems.length;

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

    const pendingHtml = pendingItems.length ? `
      <div class="notif-pending-list">
        ${pendingItems.map((item) => {
          const dl = pending.deadlineLabel(item);
          return `
            <button type="button" class="notif-pending-item ${item.critical ? 'critical' : ''}" data-open-app="${appId}" data-pending-id="${item.id}">
              <span class="notif-pending-title">${escapeHtml(item.title)}${item.critical ? ' · 重要' : ''}</span>
              ${dl ? `<span class="notif-pending-deadline">${escapeHtml(dl)}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    ` : '';

    const headerInner = `
      <button type="button" class="notif-app-header" data-open-app="${appId}" aria-expanded="${isOpen}">
        <span class="notif-app-icon app-icon-${meta.color}">${meta.icon}</span>
        <div class="notif-app-summary">
          <span class="notif-app-name">${meta.name}${isMuted ? ' · 已静音' : ''}</span>
          ${!showProgress && preview ? `<span class="notif-app-preview">${escapeHtml(preview)}</span>` : ''}
        </div>
        ${(hasMessages && count > 1) || pendingCount ? `<span class="notif-app-count">${pendingCount || count}</span>` : ''}
        ${hasMessages ? `<span class="notif-app-chevron ${isOpen ? 'open' : ''}" data-toggle="${tag}">›</span>` : ''}
      </button>
      ${progressHtml}
      ${pendingHtml}
    `;

    const cardHeader = renderSwipeRow(`app:${tag}`, headerInner);

    const bodyHtml = hasMessages ? `
      <div class="notif-app-body ${isOpen ? 'open' : ''}">
        ${messages.map((m) => renderSwipeRow(`msg:${tag}:${m.id}`, `
          <div class="notif-msg">
            <span class="notif-msg-time">${m.time}</span>
            <span class="notif-msg-text">${escapeHtml(m.text)}</span>
          </div>
        `)).join('')}
      </div>
    ` : '';

    return `<div class="notif-app-card" data-app="${tag}">${cardHeader}${bodyHtml}</div>`;
  }

  function bindCardEvents() {
    listEl?.querySelectorAll('[data-open-app]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('.notif-swipe-row.revealed, .notif-app-chevron')) return;
        e.stopPropagation();
        onOpenApp?.(btn.dataset.openApp, btn.dataset.pendingId || null);
      });
    });

    listEl?.querySelectorAll('[data-toggle]').forEach((chevron) => {
      chevron.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.closest('.notif-swipe-row.revealed')) return;
        toggleExpand(chevron.dataset.toggle);
      });
    });

    listEl?.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.delete;
        if (key.startsWith('app:')) deleteAppGroup(key.slice(4));
        else if (key.startsWith('msg:')) {
          const [, appId, msgId] = key.split(':');
          deleteMessage(appId, msgId);
        }
      });
    });

    listEl?.querySelectorAll('[data-settings]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.settings;
        if (key.startsWith('app:')) toggleMute(key.slice(4));
        else if (key.startsWith('msg:')) {
          const [, appId] = key.split(':');
          toggleMute(appId);
        }
      });
    });
  }

  function bindSwipeRows() {
    listEl?.querySelectorAll('.notif-swipe-row').forEach((row) => {
      const content = row.querySelector('.notif-swipe-content');
      if (!content) return;

      let startX = 0;
      let dragging = false;
      let activeId = null;

      row.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.notif-action-btn, [data-open-app], [data-toggle]')) return;
        startX = e.clientX;
        dragging = true;
        activeId = e.pointerId;
        content.classList.add('no-transition');
        row.setPointerCapture(e.pointerId);
      });

      row.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== activeId) return;
        let dx = e.clientX - startX;
        if (row.classList.contains('revealed')) dx -= SWIPE_ACTION_W;
        dx = Math.min(0, Math.max(-SWIPE_ACTION_W, dx));
        content.style.transform = `translateX(${dx}px)`;
      });

      row.addEventListener('pointerup', (e) => {
        if (!dragging || e.pointerId !== activeId) return;
        dragging = false;
        activeId = null;
        content.classList.remove('no-transition');

        const tx = content.style.transform;
        const dx = tx ? Number(tx.match(/-?\d+/)?.[0] || 0) : 0;
        const reveal = dx < -SWIPE_ACTION_W / 2;

        if (reveal) {
          if (revealedRow && revealedRow !== row) {
            revealedRow.classList.remove('revealed');
            revealedRow.querySelector('.notif-swipe-content').style.transform = '';
          }
          row.classList.add('revealed');
          content.style.transform = `translateX(-${SWIPE_ACTION_W}px)`;
          revealedRow = row;
        } else {
          row.classList.remove('revealed');
          content.style.transform = '';
          if (revealedRow === row) revealedRow = null;
        }

        try { row.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      });

      row.addEventListener('pointercancel', () => {
        dragging = false;
        content.classList.remove('no-transition');
      });
    });
  }

  return { add, render, setFocusProgress, onPendingChange, renderStatusIcons, renderShadeIcons, bumpRecency };
}

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
