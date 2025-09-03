// ==UserScript==
// @name         Stash Revert Groups to Movies
// @author       Splash4K
// @version      0.2.0
// @description  Revert "Groups" with "Movies" in Stash
// @match        http://localhost:9999/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Don't touch
  const EXCLUDE_SELECTOR = [
    'script',
    'style',
    '[data-ignore-replace]',
    '.alias-head',
    '.card-section-title',
    '.tag-name',
    '.tooltip-inner',
    '.TruncatedText'
  ].join(',');

  const replacements = [
    ['sub-groups', 'sub-movies'],
    ['sub-group', 'sub-movie'],
    ['select groups', 'select movies'],
    ['select group', 'select movie'],
    ['groups', 'movies'],
    ['group', 'movie'],
  ].map(([search, repl]) => ({
    regex: new RegExp(`\\b${escapeRegExp(search)}\\b`, 'gi'),
    repl
  }));

  const lastSeen = new WeakMap();

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function caseSmartReplace(match, repl) {
    if (match.toUpperCase() === match.toLowerCase()) return repl;
    if (match === match.toUpperCase()) return repl.toUpperCase();
    if (match[0] === match[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
    return repl;
  }

  function transformText(input) {
    let changed = false;
    let out = input;

    for (const { regex, repl } of replacements) {
      out = out.replace(regex, (m) => {
        changed = true;
        return caseSmartReplace(m, repl);
      });
    }

    return changed ? out : null;
  }

  function shouldSkip(node) {
    return node.parentElement && node.parentElement.closest(EXCLUDE_SELECTOR);
  }

  function processTextNode(tn) {
    if (shouldSkip(tn)) return;

    const current = tn.nodeValue;
    if (lastSeen.get(tn) === current) return;

    const result = transformText(current);
    if (result !== null && result !== current) {
      tn.nodeValue = result;
      lastSeen.set(tn, result);
    } else {
      lastSeen.set(tn, current);
    }
  }

  function walkAndProcess(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return (node.nodeValue && /\S/.test(node.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      processTextNode(n);
    }
  }

  // Batch mutation handling (micro-debounced)
  let scheduled = false;
  const pendingRoots = new Set();

  function scheduleProcess(root) {
    if (root) pendingRoots.add(root);
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      scheduled = false;

      for (const r of roots) {
        if (r.isConnected || r === document) walkAndProcess(r === document ? document.body : r);
      }
    });
  }

  function init() {
    scheduleProcess(document);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              processTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE && !node.matches(EXCLUDE_SELECTOR)) {
              scheduleProcess(node);
            }
          }
        }
        if (m.type === 'characterData' && m.target && m.target.nodeType === Node.TEXT_NODE) {
          processTextNode(m.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
