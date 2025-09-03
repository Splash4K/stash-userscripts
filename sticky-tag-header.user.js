// ==UserScript==
// @name         Stash - Sticky Tagger Header
// @version      0.2
// @description  Keeps tag header sticky while scrolling
// @icon         https://raw.githubusercontent.com/stashapp/stash/v0.24.0/ui/v2.5/public/favicon.png
// @author       Splash4K
// @match        http://localhost:9999/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
  const MAIN_NAV_SEL = [
    'header.navbar',
    '.navbar',
    '.navbar.sticky-top',
    '.navbar.navbar-dark',
    'header[role="banner"]',
    '.top-nav',
    '[data-testid="navbar"]'
  ].join(',');
  const DETAIL_NAV_SEL = '.sticky.detail-header, .detail-header.sticky, .detail-header';

  const style = document.createElement('style');
  style.textContent = `
    :root { --sticky-offset: 50px; --sticky-nudge: 1px; --sticky-z: 1; }
    .tagger-container-header {
      position: sticky !important;
      top: calc(var(--sticky-offset) - var(--sticky-nudge)) !important;
      z-index: var(--sticky-z) !important;
      background-color: rgba(40, 42, 54, 0.7) !important;
      padding-left: 35px;
      padding-right: 35px;
      backdrop-filter: saturate(120%) blur(2px);
      margin-top: 0 !important;
    }
    .collapse.show.card { max-height: 50dvh; overflow-y: auto; }
  `;
  document.head.appendChild(style);

  const vis = (el) => {
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  };
  const zOf = (el) => {
    const z = getComputedStyle(el).zIndex;
    const n = Number(z);
    return Number.isFinite(n) ? n : 0;
  };

  function pinnedBottomAtTop() {
    const nodes = Array.from(document.querySelectorAll(MAIN_NAV_SEL)).filter(vis);
    const pinned = nodes.filter(el => {
      const cs = getComputedStyle(el);
      if (!(cs.position === 'fixed' || cs.position === 'sticky')) return false;
      const r = el.getBoundingClientRect();
      return r.top <= 1 && r.bottom > 1;
    });
    if (pinned.length) return Math.round(Math.max(...pinned.map(el => el.getBoundingClientRect().bottom)));
    if (nodes.length) return Math.round(Math.max(...nodes.map(el => el.getBoundingClientRect().bottom)));
    return 50;
  }

  function pinnedBottomUnder(topEdge) {
    const nodes = Array.from(document.querySelectorAll(DETAIL_NAV_SEL)).filter(vis);
    const pinned = nodes.filter(el => {
      const cs = getComputedStyle(el);
      if (!(cs.position === 'fixed' || cs.position === 'sticky')) return false;
      const r = el.getBoundingClientRect();
      return r.top <= topEdge + 1 && r.bottom > r.top;
    });
    if (!pinned.length) return 0;
    return Math.round(Math.max(...pinned.map(el => el.getBoundingClientRect().bottom)));
  }

  function apply() {
    const topEdge = pinnedBottomAtTop();
    const underEdge = pinnedBottomUnder(topEdge);
    const offset = Math.max(topEdge, underEdge || 0);
    document.documentElement.style.setProperty('--sticky-offset', `${offset}px`);

    const headers = [
      ...Array.from(document.querySelectorAll(MAIN_NAV_SEL)),
      ...Array.from(document.querySelectorAll(DETAIL_NAV_SEL))
    ].filter(vis);
    const navZ = headers.reduce((m, el) => Math.max(m, zOf(el)), 0);
    document.documentElement.style.setProperty('--sticky-z', `${Math.max(0, navZ - 1)}`);
  }

  const ro = new ResizeObserver(apply);
  const mo = new MutationObserver(() => { observe(); apply(); });

  let observed = new Set();
  function observe() {
    const nodes = new Set([
      ...document.querySelectorAll(MAIN_NAV_SEL),
      ...document.querySelectorAll(DETAIL_NAV_SEL)
    ]);
    nodes.forEach(el => { if (!observed.has(el)) { try { ro.observe(el); } catch {} } });
    for (const el of observed) { if (!nodes.has(el)) { try { ro.unobserve(el); } catch {} } }
    observed = nodes;
  }

  function init() {
    observe();
    apply();
    try { mo.observe(document.body, { childList: true, subtree: true, attributes: true }); } catch {}
    let raf = null;
    addEventListener('scroll', () => { if (!raf) { raf = requestAnimationFrame(() => { apply(); raf = null; }); } }, { passive: true });
    addEventListener('resize', apply, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
