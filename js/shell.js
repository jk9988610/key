/** 仅收录结构化系统行，过滤叙事废话 */
const NOTIFY_PREFIX = /^\[(SYS|DIP|FOC|EVT)\]/;

export function createNotifications({ listEl, badgeEl }) {
  const items = [];
  const MAX = 40;

  function add(text, type = 'sys') {
    if (!NOTIFY_PREFIX.test(text)) return;

    const tag = text.match(/^\[(\w+)\]/)?.[1]?.toLowerCase() || type;
    const entry = {
      text,
      type: tag === 'dip' ? 'dip' : tag === 'foc' ? 'foc' : tag === 'evt' ? 'evt' : 'sys',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    items.unshift(entry);
    if (items.length > MAX) items.pop();

    if (badgeEl) {
      badgeEl.hidden = false;
      badgeEl.title = `${items.length} 条通知`;
    }
    render();
  }

  function render() {
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<p class="notif-empty">暂无系统通知</p>';
      return;
    }
    listEl.innerHTML = items.map((n) => `
      <div class="notif-item notif-${n.type}">
        <span class="notif-time">${n.time}</span>
        <span class="notif-text">${escapeHtml(n.text)}</span>
      </div>
    `).join('');
  }

  function clearBadge() {
    if (badgeEl) badgeEl.hidden = true;
  }

  return { add, render, clearBadge };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function createShell({ onShadeOpen } = {}) {
  const home = document.getElementById('app-home');
  const statusBar = document.getElementById('status-bar');
  const shade = document.getElementById('notification-shade');
  const shadeBackdrop = document.getElementById('shade-backdrop');
  const homePages = document.getElementById('home-pages');
  const pageDots = document.getElementById('page-dots');
  const notifBadge = document.getElementById('notif-badge');

  let currentApp = null;
  let currentSub = null;
  let homePage = 0;
  const HOME_PAGE_COUNT = 2;

  const SUB_MAP = {
    'focus-log': 'sub-focus-log',
    'dip-log': 'sub-dip-log',
    'intel-log': 'sub-intel-log',
  };

  function closeShade() {
    shade?.classList.remove('open');
    shadeBackdrop?.classList.remove('open');
  }

  function openShade() {
    shade?.classList.add('open');
    shadeBackdrop?.classList.add('open');
    onShadeOpen?.();
  }

  function closeAllSubs() {
    document.querySelectorAll('.sub-screen.sub-open').forEach((el) => {
      el.classList.remove('sub-open');
    });
    currentSub = null;
  }

  function showHome() {
    currentApp = null;
    closeAllSubs();
    document.querySelectorAll('.app-screen').forEach((v) => {
      if (v.id === 'app-home') {
        v.hidden = false;
      } else {
        v.hidden = true;
      }
    });
    closeShade();
  }

  function openApp(appId) {
    const screen = document.getElementById(`app-${appId}`);
    if (!screen) return;
    currentApp = appId;
    closeAllSubs();
    if (home) home.hidden = true;
    document.querySelectorAll('.app-screen').forEach((v) => {
      if (v.id === 'app-home') v.hidden = true;
      else v.hidden = v.id !== `app-${appId}`;
    });
    closeShade();
  }

  function openSub(subId) {
    const elId = SUB_MAP[subId];
    const sub = elId ? document.getElementById(elId) : null;
    if (!sub) return;
    closeAllSubs();
    sub.classList.add('sub-open');
    currentSub = subId;
  }

  function navigateBack() {
    if (shade?.classList.contains('open')) {
      closeShade();
      return true;
    }
    const modal = document.getElementById('phone-modal');
    if (modal && !modal.hidden) return false;

    if (currentSub) {
      closeAllSubs();
      return true;
    }
    if (currentApp) {
      showHome();
      return true;
    }
    return false;
  }

  function setHomePage(index) {
    homePage = Math.max(0, Math.min(HOME_PAGE_COUNT - 1, index));
    if (homePages) {
      homePages.style.transform = `translateX(-${homePage * 100}%)`;
    }
    pageDots?.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === homePage);
    });
  }

  document.querySelectorAll('.app-launcher').forEach((btn) => {
    btn.addEventListener('click', () => openApp(btn.dataset.app));
  });

  document.querySelectorAll('.nav-back, .sub-back').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateBack();
    });
  });

  document.querySelectorAll('[data-sub-open]').forEach((btn) => {
    btn.addEventListener('click', () => openSub(btn.dataset.subOpen));
  });

  shadeBackdrop?.addEventListener('click', closeShade);

  /* 上滑关闭通知栏 */
  let shadeStartY = 0;
  shade?.addEventListener('touchstart', (e) => {
    shadeStartY = e.touches[0].clientY;
  }, { passive: true });
  shade?.addEventListener('touchend', (e) => {
    if (!shade?.classList.contains('open')) return;
    const dy = e.changedTouches[0].clientY - shadeStartY;
    if (dy < -40) closeShade();
  }, { passive: true });

  pageDots?.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => setHomePage(Number(dot.dataset.page)));
  });

  /* ── 下拉状态栏打开通知 ── */
  let pullStartY = 0;
  let pulling = false;

  function onPullStart(y) {
    if (shade?.classList.contains('open')) return;
    pullStartY = y;
    pulling = true;
  }

  function onPullMove(y) {
    if (!pulling) return;
    const dy = y - pullStartY;
    if (dy > 50) {
      openShade();
      pulling = false;
    }
  }

  function onPullEnd() {
    pulling = false;
  }

  statusBar?.addEventListener('touchstart', (e) => onPullStart(e.touches[0].clientY), { passive: true });
  statusBar?.addEventListener('touchmove', (e) => onPullMove(e.touches[0].clientY), { passive: true });
  statusBar?.addEventListener('touchend', onPullEnd);

  statusBar?.addEventListener('mousedown', (e) => onPullStart(e.clientY));
  window.addEventListener('mousemove', (e) => { if (pulling) onPullMove(e.clientY); });
  window.addEventListener('mouseup', onPullEnd);

  notifBadge?.addEventListener('click', (e) => {
    e.stopPropagation();
    openShade();
  });

  /* ── 边缘滑动返回（触控 + 鼠标） ── */
  let edgeStartX = 0;
  let edgeSide = null;
  let edgeMouseDown = false;

  function tryEdgeBack(endX) {
    if (!edgeSide) return;
    const dx = endX - edgeStartX;
    const towardCenter = (edgeSide === 'left' && dx > 55) || (edgeSide === 'right' && dx < -55);
    if (towardCenter) navigateBack();
    edgeSide = null;
    edgeMouseDown = false;
  }

  function bindEdgeSwipe(zone, side) {
    zone?.addEventListener('touchstart', (e) => {
      edgeStartX = e.touches[0].clientX;
      edgeSide = side;
    }, { passive: true });

    zone?.addEventListener('touchend', (e) => {
      if (edgeSide !== side) return;
      tryEdgeBack(e.changedTouches[0].clientX);
    }, { passive: true });

    zone?.addEventListener('mousedown', (e) => {
      edgeStartX = e.clientX;
      edgeSide = side;
      edgeMouseDown = true;
      e.preventDefault();
    });

    zone?.addEventListener('mouseup', (e) => {
      if (!edgeMouseDown || edgeSide !== side) return;
      tryEdgeBack(e.clientX);
    });
  }

  bindEdgeSwipe(document.getElementById('edge-swipe-left'), 'left');
  bindEdgeSwipe(document.getElementById('edge-swipe-right'), 'right');

  /* ── 主屏左右翻页（触控 + 鼠标） ── */
  let pageStartX = 0;
  let pageSwiping = false;
  let pageMouseDown = false;

  function tryPageSwipe(endX) {
    const dx = endX - pageStartX;
    if (dx < -50 && homePage < HOME_PAGE_COUNT - 1) setHomePage(homePage + 1);
    else if (dx > 50 && homePage > 0) setHomePage(homePage - 1);
    pageSwiping = false;
    pageMouseDown = false;
  }

  function onPageStart(x) {
    if (currentApp || shade?.classList.contains('open')) return;
    pageStartX = x;
    pageSwiping = true;
  }

  home?.addEventListener('touchstart', (e) => {
    onPageStart(e.touches[0].clientX);
  }, { passive: true });

  home?.addEventListener('touchend', (e) => {
    if (!pageSwiping || currentApp) return;
    tryPageSwipe(e.changedTouches[0].clientX);
  }, { passive: true });

  home?.addEventListener('mousedown', (e) => {
    if (e.target.closest('.app-launcher, .tool-btn, .page-dots, .nav-back, .sub-back')) return;
    onPageStart(e.clientX);
    pageMouseDown = true;
  });

  home?.addEventListener('mouseup', (e) => {
    if (!pageMouseDown || !pageSwiping || currentApp) return;
    tryPageSwipe(e.clientX);
  });

  setHomePage(0);

  return { showHome, openApp, navigateBack, openShade, closeShade, closeAllSubs };
}
