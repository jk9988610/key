const HOME_PAGE_COUNT = 2;
const DEFAULT_HOME_PAGE = 1;
const EDGE_BACK_THRESHOLD = 18;
/** 逻辑边框目标宽度（px），实际会按屏幕宽度收窄 */
const LOGICAL_EDGE_TARGET = 96;
const MIN_CENTER_WIDTH = 100;
const SWIPE_THRESHOLD = 48;
const SWIPE_VELOCITY = 0.35;

export function createShell() {
  const home = document.getElementById('app-home');
  const phoneDevice = document.getElementById('phone-device');
  const phoneFrame = document.getElementById('phone-frame');
  const mainScreen = document.getElementById('main-screen');
  const statusBar = document.getElementById('status-bar');
  const shade = document.getElementById('notification-shade');
  const shadeBackdrop = document.getElementById('shade-backdrop');
  const homePager = document.getElementById('home-pager');
  const homePages = document.getElementById('home-pages');
  const pageDots = document.getElementById('page-dots');

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
    updateEdgeBackUI();
  }

  function openShade() {
    shade?.classList.add('open');
    shadeBackdrop?.classList.add('open');
    updateEdgeBackUI();
  }

  function closeAllSubs() {
    document.querySelectorAll('.sub-screen.sub-open').forEach((el) => {
      el.classList.remove('sub-open');
    });
    currentSub = null;
    updateEdgeBackUI();
  }

  function showHome() {
    currentApp = null;
    closeAllSubs();
    document.querySelectorAll('.app-screen').forEach((v) => {
      v.hidden = v.id !== 'app-home';
    });
    closeShade();
    setHomePage(DEFAULT_HOME_PAGE, false);
    updateEdgeBackUI();
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
    updateEdgeBackUI();
  }

  function openSub(subId) {
    const elId = SUB_MAP[subId];
    const sub = elId ? document.getElementById(elId) : null;
    if (!sub) return;
    closeAllSubs();
    sub.classList.add('sub-open');
    currentSub = subId;
    updateEdgeBackUI();
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

  function canEdgeBack() {
    const modal = document.getElementById('phone-modal');
    if (modal && !modal.hidden) return false;
    return Boolean(currentApp) || Boolean(currentSub) || shade?.classList.contains('open');
  }

  function updateEdgeBackUI() {
    phoneDevice?.classList.toggle('can-edge-back', canEdgeBack());
  }

  function syncPagerTransform(animate) {
    if (!homePages) return;
    homePages.classList.toggle('no-transition', !animate);
    homePages.style.transform = `translate3d(-${homePage * 100}%, 0, 0)`;
    if (!animate) {
      requestAnimationFrame(() => homePages?.classList.remove('no-transition'));
    }
  }

  function setHomePage(index, animate = true) {
    homePage = Math.max(0, Math.min(HOME_PAGE_COUNT - 1, index));
    syncPagerTransform(animate);
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
      homePages.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function finishDrag(dx, dt) {
      const velocity = dt > 0 ? dx / dt : 0;
      let next = homePage;

      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(velocity) > SWIPE_VELOCITY) {
        if (dx < 0 && homePage < HOME_PAGE_COUNT - 1) next = homePage + 1;
        else if (dx > 0 && homePage > 0) next = homePage - 1;
      }

      homePage = next;
      homePages.classList.remove('no-transition');
      syncPagerTransform(true);
      pageDots?.querySelectorAll('.dot').forEach((d) => {
        d.classList.toggle('active', Number(d.dataset.page) === homePage);
      });
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
          syncPagerTransform(false);
          return;
        }
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') {
          dragging = false;
          homePager.releasePointerCapture(e.pointerId);
          syncPagerTransform(false);
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
      finishDrag(dx, dt);
    }

    function onCancel(e) {
      if (e.pointerId !== activeId) return;
      dragging = false;
      activeId = null;
      homePager.classList.remove('is-dragging');
      syncPagerTransform(true);
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

  function createShadeDismiss() {
    if (!shade) return;

    let startY = 0;
    let startX = 0;
    let activeId = null;

    function isInteractiveTarget(target) {
      return Boolean(target.closest(
        '.notif-app-card, .notif-swipe-row, .notif-action-btn, .shade-app-icons button, button, a',
      ));
    }

    shade.addEventListener('click', (e) => {
      if (!shade.classList.contains('open')) return;
      if (isInteractiveTarget(e.target)) return;
      closeShade();
    });

    shade.addEventListener('pointerdown', (e) => {
      if (!shade.classList.contains('open')) return;
      if (e.target.closest('.notif-action-btn')) return;
      startY = e.clientY;
      startX = e.clientX;
      activeId = e.pointerId;
    });

    shade.addEventListener('pointerup', (e) => {
      if (e.pointerId !== activeId) return;
      if (!shade.classList.contains('open')) return;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      if (dy < -28 && Math.abs(dy) > Math.abs(dx)) closeShade();
      activeId = null;
    });

    shade.addEventListener('pointercancel', () => { activeId = null; });
  }

  createShadeDismiss();

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

  statusBar?.addEventListener('touchstart', (e) => {
    if (e.target.closest('.status-app-icons, .status-speed-group')) return;
    onPullStart(e.touches[0].clientY);
  }, { passive: true });
  statusBar?.addEventListener('touchmove', (e) => onPullMove(e.touches[0].clientY), { passive: true });
  statusBar?.addEventListener('touchend', onPullEnd);
  statusBar?.addEventListener('mousedown', (e) => {
    if (e.target.closest('.status-app-icons, .status-speed-group')) return;
    onPullStart(e.clientY);
  });
  window.addEventListener('mousemove', (e) => { if (pulling) onPullMove(e.clientY); });
  window.addEventListener('mouseup', onPullEnd);

  function createEdgeBackSwipe() {
    if (!phoneFrame || !mainScreen) return;

    let gesture = null;

    function frameRect() {
      return phoneFrame.getBoundingClientRect();
    }

    /** 逻辑大边框，但保证不超出屏幕且中间留出可操作区 */
    function getEdgeWidth() {
      const w = frameRect().width;
      const maxEachSide = Math.floor(w * 0.26);
      const reserveCenter = Math.max(MIN_CENTER_WIDTH, Math.floor(w * 0.36));
      const fromCenter = Math.max(0, Math.floor((w - reserveCenter) / 2));
      return Math.min(LOGICAL_EDGE_TARGET, maxEachSide, fromCenter);
    }

    function syncEdgeWidth() {
      phoneFrame.style.setProperty('--edge-logical-w', `${getEdgeWidth()}px`);
    }

    function inFrame(clientX, clientY) {
      const r = frameRect();
      return clientX >= r.left && clientX <= r.right
        && clientY >= r.top && clientY <= r.bottom;
    }

    function sideAt(clientX) {
      const r = frameRect();
      const localX = clientX - r.left;
      const edge = getEdgeWidth();
      if (localX <= edge) return 'left';
      if (localX >= r.width - edge) return 'right';
      return null;
    }

    function isExcludedTarget(target) {
      return Boolean(target?.closest?.(
        '#btn-speed-down, #btn-speed-up, #btn-speed-toggle, .phone-modal:not([hidden]), .notif-action-btn',
      ));
    }

    function tryCapture(pointerId) {
      try { phoneFrame.setPointerCapture(pointerId); } catch { /* noop */ }
    }

    function releaseCapture(pointerId) {
      try { phoneFrame.releasePointerCapture(pointerId); } catch { /* noop */ }
    }

    function onPointerDown(e) {
      if (!canEdgeBack()) return;
      if (e.button !== undefined && e.button !== 0) return;
      if (!inFrame(e.clientX, e.clientY)) return;
      if (isExcludedTarget(e.target)) return;

      const side = sideAt(e.clientX);
      gesture = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        anchorX: e.clientX,
        side,
        engaged: Boolean(side),
      };
      if (side) tryCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!gesture || e.pointerId !== gesture.pointerId || !canEdgeBack()) return;

      if (!gesture.engaged) {
        const side = sideAt(e.clientX);
        if (side) {
          gesture.engaged = true;
          gesture.side = side;
          gesture.anchorX = e.clientX;
          tryCapture(e.pointerId);
        }
      }
    }

    function onPointerUp(e) {
      if (!gesture || e.pointerId !== gesture.pointerId) return;

      if (gesture.engaged && gesture.side) {
        const dx = e.clientX - gesture.anchorX;
        const dy = e.clientY - gesture.startY;
        const horizontal = Math.abs(dx) >= EDGE_BACK_THRESHOLD
          && Math.abs(dx) > Math.abs(dy) * 0.45;
        const towardCenter = (gesture.side === 'left' && dx > 0)
          || (gesture.side === 'right' && dx < 0);
        if (horizontal && towardCenter) navigateBack();
      }

      releaseCapture(e.pointerId);
      gesture = null;
    }

    function onPointerCancel(e) {
      if (gesture && e.pointerId === gesture.pointerId) {
        releaseCapture(e.pointerId);
        gesture = null;
      }
    }

    phoneFrame.addEventListener('pointerdown', onPointerDown, { capture: true });
    phoneFrame.addEventListener('pointermove', onPointerMove, { capture: true });
    phoneFrame.addEventListener('pointerup', onPointerUp, { capture: true });
    phoneFrame.addEventListener('pointercancel', onPointerCancel, { capture: true });

    syncEdgeWidth();
    window.addEventListener('resize', syncEdgeWidth);
  }

  createEdgeBackSwipe();
  updateEdgeBackUI();

  createHomePager();
  setHomePage(DEFAULT_HOME_PAGE, false);
  showHome();

  return { showHome, openApp, navigateBack, openShade, closeShade, closeAllSubs, setHomePage, refreshUI: updateEdgeBackUI };
}
