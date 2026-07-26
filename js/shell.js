const HOME_PAGE_COUNT = 2;
const DEFAULT_HOME_PAGE = 1;
const EDGE_BACK_THRESHOLD = 40;
const SWIPE_THRESHOLD = 48;
const SWIPE_VELOCITY = 0.35;

export function createShell() {
  const home = document.getElementById('app-home');
  const bezelLeft = document.getElementById('edge-back-left');
  const bezelRight = document.getElementById('edge-back-right');
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
    const active = canEdgeBack();
    bezelLeft?.classList.toggle('bezel-inactive', !active);
    bezelRight?.classList.toggle('bezel-inactive', !active);
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

  function createEdgeBackSwipe() {
    function bindBezel(el, side) {
      if (!el) return;

      let startX = 0;
      let activeId = null;
      let tracking = false;

      function reset() {
        tracking = false;
        activeId = null;
      }

      el.addEventListener('pointerdown', (e) => {
        if (!canEdgeBack()) return;
        if (e.button !== undefined && e.button !== 0) return;
        startX = e.clientX;
        activeId = e.pointerId;
        tracking = true;
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });

      el.addEventListener('pointerup', (e) => {
        if (!tracking || e.pointerId !== activeId) return;
        const dx = e.clientX - startX;
        const towardCenter = (side === 'left' && dx > EDGE_BACK_THRESHOLD)
          || (side === 'right' && dx < -EDGE_BACK_THRESHOLD);
        if (towardCenter) navigateBack();
        try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
        reset();
      });

      el.addEventListener('pointercancel', (e) => {
        if (e.pointerId !== activeId) return;
        try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
        reset();
      });
    }

    bindBezel(bezelLeft, 'left');
    bindBezel(bezelRight, 'right');
  }

  createEdgeBackSwipe();
  updateEdgeBackUI();

  createHomePager();
  setHomePage(DEFAULT_HOME_PAGE, false);
  showHome();

  return { showHome, openApp, navigateBack, openShade, closeShade, closeAllSubs, setHomePage, refreshUI: updateEdgeBackUI };
}
