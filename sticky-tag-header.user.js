// ==UserScript==
// @name         Stash - Sticky Tagger Header
// @version      0.1
// @description  Keeps tag header sticky while scrolling
// @icon         https://raw.githubusercontent.com/stashapp/stash/v0.24.0/ui/v2.5/public/favicon.png
// @author       Splash4K
// @match        http://localhost:9999/scenes*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //navbar height
    const navbarHeight = 49;

    window.addEventListener('scroll', function () {
        const taggerContainer = document.querySelector('.tagger-container-header');
        if (!taggerContainer) return;

        if (window.scrollY >= navbarHeight) {
            taggerContainer.style.position = 'fixed';
            taggerContainer.style.top = navbarHeight + 'px';
            taggerContainer.style.left = '0';
            taggerContainer.style.width = '100%';
            taggerContainer.style.backgroundColor = 'rgba(40, 42, 54, 0.7)'; // #282A36 with 20% opacity
            taggerContainer.style.zIndex = '10';
            taggerContainer.style.paddingLeft = '35px';
            taggerContainer.style.paddingRight = '35px';
        } else {
            taggerContainer.style.position = '';
            taggerContainer.style.top = '';
            taggerContainer.style.left = '';
            taggerContainer.style.width = '';
            taggerContainer.style.backgroundColor = '';
            taggerContainer.style.zIndex = '';
            taggerContainer.style.paddingLeft = '';
            taggerContainer.style.paddingRight = '';
        }
    });

    // Add CSS rule for options visibility
    const style = document.createElement('style');
    style.textContent = `
        .collapse.show.card {
            max-height: 50dvh;
            overflow-y: auto;
        }
    `;
    document.head.appendChild(style);
})();
