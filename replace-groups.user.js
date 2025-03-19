// ==UserScript==
// @name         Stash Revert Groups to Movies
// @author       Splash4K
// @version      0.1.1
// @description  Revert "Groups" with "Movies" in Stash
// @match        http://localhost:9999/*
// ==/UserScript==

(function () {
    'use strict';

    const replacements = {
        "groups": "movies",
        "group": "movie",
        "select groups": "select movies",
        "select group": "select movie",
        "sub-group": "sub-movie",
        "sub-groups": "sub-movies"
    };

    function replaceTextContent(node) {
        let text = node.textContent.trim();
        for (const [search, replace] of Object.entries(replacements)) {
            const regex = new RegExp(`\\b${search}\\b`, 'gi');
            text = text.replace(regex, (match) =>
                match[0] === match[0].toUpperCase() ? replace.charAt(0).toUpperCase() + replace.slice(1) : replace
            );
        }
        node.textContent = text;
    }

    function processElements() {
        document.querySelectorAll('*:not(script):not(style):not([data-ignore-replace]):not(.alias-head):not(.card-section-title):not(.tag-name):not(.tooltip-inner):not(.TruncatedText)').forEach((el) => {
            if (!el.closest('.alias-head, .card-section-title, .tag-name, .tooltip-inner, .TruncatedText') && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                replaceTextContent(el);
            }
        });
    }

    function init() {
        processElements();
        const observer = new MutationObserver(processElements);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
