/** 仅收录结构化系统行，过滤叙事废话 */
const NOTIFY_PREFIX = /^\[(SYS|DIP|FOC|EVT)\]/;

const HOME_PAGE_COUNT = 3;
const DEFAULT_HOME_PAGE = 1;
const SWIPE_THRESHOLD = 48;
const SWIPE_VELOCITY = 0.35;

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
  const homePager = document.getElementById('home-pager');
  const homePages = document.getElementById('home-pages');
  const pageDots = document.getElementById('page-dots');
  const notifBadge = document.getElementById('notif-badge');

  let currentApp = null;
  let currentSub = null;
  let homePage = DEFAULT_HOME_PAGE;

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
      v.hidden = v.id !== 'app-home';
    });
    closeShade();
    setHomePage(DEFAULT_HOME_PAGE, false);
  }

  function openApp(appId) {
    const screen = document.getElementById(`app-${appId}`);
    if (!screen) return;
    currentApp = appId;
    closeAllSubs();
    document.querySelectorAll('.app-screen').forEach((v) => {
      v.hidden = v.id !== `app-${appId}`;
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

  function setHomePage(index, animate = true) {
    homePage = Math.max(0, Math.min(HOME_PAGE_COUNT - 1, index));
    if (homePages) {
      homePages.classList.toggle('no-transition', !animate);
      homePages.style.transform = `translateX(-${homePage * 100}%)`;
      if (!animate) {
        requestAnimationFrame(() => homePages?.classList.remove('no-transition'));
      }
    }
    pageDots?.querySelectorAll('.dot').forEach((d) => {
      d.classList.toggle('active', Number(d.dataset.page) === homePage);
    });
  }

  function isPagerBlocked() {
    return Boolean(currentApp) || shade?.classList.contains('open');
  }

  function createHomePager() {
    if (!homePager || !homePages) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let activeId = null;
    let axis = null;
    let dragging = false;

    function pageWidth() {
      return homePager.clientWidth || 1;
    }

    function applyOffset(dx) {
      const w = pageWidth();
      const minX = -(HOME_PAGE_COUNT - 1) * w;
      const maxX = 0;
      let x = -homePage * w + dx;
      if (x > maxX) x = maxX + (x - maxX) * 0.35;
      if (x < minX) x = minX + (x - minX) * 0.35;
      homePages.style.transform = `translateX(${x}px)`;
    }

    function finishDrag(dx, dt) {
      const w = pageWidth();
      const velocity = dt > 0 ? dx / dt : 0;
      let next = homePage;

      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(velocity) > SWIPE_VELOCITY) {
        if (dx < 0 && homePage < HOME_PAGE_COUNT - 1) next = homePage + 1;
        else if (dx > 0 && homePage > 0) next = homePage - 1;
      }

      setHomePage(next, true);
    }

    function onDown(e) {
      if (isPagerBlocked()) return;
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('button, a, input, textarea, select, .dot')) return;

      activeId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      axis = null;
      dragging = true;
      homePages.classList.add('no-transition');
      homePager.setPointerCapture(e.pointerId);
    }

    function onMove(e) {
      if (!dragging || e.pointerId !== activeId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        const inConsole = e.target.closest('#text-stream');
        if (inConsole && Math.abs(dy) >= Math.abs(dx)) {
          axis = 'y';
          dragging = false;
          homePager.releasePointerCapture(e.pointerId);
          setHomePage(homePage, false);
          return;
        }
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') {
          dragging = false;
          homePager.releasePointerCapture(e.pointerId);
          setHomePage(homePage, false);
          return;
        }
      }

      if (axis !== 'x') return;
      e.preventDefault();
      homePager.classList.add('is-dragging');
      applyOffset(dx);
    }

    function onUp(e) {
      if (!dragging || e.pointerId !== activeId) return;
      dragging = false;
      activeId = null;
      homePager.classList.remove('is-dragging');

      const dx = e.clientX - startX;
      const dt = performance.now() - startTime;
      try { homePager.releasePointerCapture(e.pointerId); } catch { /* noop */ }

      homePages.classList.add('no-transition');
      homePages.style.transform = `translateX(-${homePage * 100}%)`;
      homePages.offsetHeight;
      finishDrag(dx, dt);
    }

    function onCancel(e) {
      if (e.pointerId !== activeId) return;
      dragging = false;
      activeId = null;
      homePager.classList.remove('is-dragging');
      setHomePage(homePage, true);
    }

    homePager.addEventListener('pointerdown', onDown);
    homePager.addEventListener('pointermove', onMove);
    homePager.addEventListener('pointerup', onUp);
    homePager.addEventListener('pointercancel', onCancel);
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

  let pullStartY = 0;
  let pulling = false;

  function onPullStart(y) {
    if (shade?.classList.contains('open')) return;
    pullStartY = y;
    pulling = true;
  }

  function onPullMove(y) {
    if (!pulling) return;
    if (y - pullStartY > 50) {
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

  createHomePager();
  setHomePage(DEFAULT_HOME_PAGE, false);
  showHome();

  return { showHome, openApp, navigateBack, openShade, closeShade, closeAllSubs, setHomePage };
}
