import { formatDateISO } from './state.js';

/** 状态栏通知（下拉通知栏） */
export function createNotifications({ listEl, badgeEl }) {
  const items = [];
  const MAX = 30;

  function add(text, type = 'sys') {
    const entry = { text, type, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    items.unshift(entry);
    if (items.length > MAX) items.pop();
    if (badgeEl) {
      const unread = items.length;
      badgeEl.textContent = unread > 9 ? '9+' : String(unread);
      badgeEl.hidden = unread === 0;
    }
    render();
  }

  function render() {
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<p class="notif-empty">暂无通知</p>';
      return;
    }
    listEl.innerHTML = items.map((n) => `
      <div class="notif-item notif-${n.type}">
        <span class="notif-time">${n.time}</span>
        <span class="notif-text">${escapeHtml(n.text)}</span>
      </div>
    `).join('');
  }

  return { add, render };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 手机壳导航：主屏 ↔ 应用 ↔ 下级 */
export function createShell() {
  const home = document.getElementById('app-home');
  const views = document.querySelectorAll('.app-screen');
  const shade = document.getElementById('notification-shade');
  const shadeBackdrop = document.getElementById('shade-backdrop');
  const statusBar = document.getElementById('status-bar');

  let currentApp = null;

  function showHome() {
    currentApp = null;
    views.forEach((v) => { v.hidden = true; });
    if (home) home.hidden = false;
    closeShade();
  }

  function openApp(appId) {
    const screen = document.getElementById(`app-${appId}`);
    if (!screen) return;
    currentApp = appId;
    if (home) home.hidden = true;
    views.forEach((v) => { v.hidden = v.id !== `app-${appId}`; });
    closeShade();
  }

  function openSub(subId) {
    const sub = document.getElementById(`sub-${subId}`);
    if (sub) sub.hidden = false;
  }

  function closeSub(subId) {
    const sub = document.getElementById(`sub-${subId}`);
    if (sub) sub.hidden = true;
  }

  function toggleShade() {
    if (!shade) return;
    const open = !shade.classList.contains('open');
    shade.classList.toggle('open', open);
    shadeBackdrop?.classList.toggle('open', open);
  }

  function closeShade() {
    shade?.classList.remove('open');
    shadeBackdrop?.classList.remove('open');
  }

  document.querySelectorAll('.app-launcher').forEach((btn) => {
    btn.addEventListener('click', () => openApp(btn.dataset.app));
  });

  document.querySelectorAll('.nav-back').forEach((btn) => {
    btn.addEventListener('click', () => showHome());
  });

  document.querySelectorAll('[data-sub-open]').forEach((btn) => {
    btn.addEventListener('click', () => openSub(btn.dataset.subOpen));
  });

  document.querySelectorAll('[data-sub-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeSub(btn.dataset.subClose));
  });

  statusBar?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-notif-toggle, .status-bar-center')) toggleShade();
  });

  document.getElementById('btn-notif-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleShade();
  });

  shadeBackdrop?.addEventListener('click', closeShade);

  return { showHome, openApp, toggleShade, closeShade };
}
