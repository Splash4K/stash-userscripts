// ==UserScript==
// @name         GitHub - Disable 'New issue' Button (Whitelist)
// @version      0.1
// @author       Splash4K
// @description  Disable the 'New issue' button on selected repos unless an approved account is logged in.
// @match        https://github.com/*
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    /* ---------- CONFIG ---------- */
    const ALLOWED_USERS   = ['user1', 'user2']; // GitHub usernames that CAN open issues in below repos
    const PROTECTED_REPOS = ['stashapp/CommunityScrapers', 'stashapp/CommunityScripts']; // repo slugs to lock down  (owner/repo)
    /* ---------------------------- */

    /* util */
    const norm = s => (s || '').trim().toLowerCase();
    const user = () =>  norm(document.querySelector('meta[name="user-login"]')?.content);
    const repo = () => {
        const [, owner, r] = location.pathname.split('/');
        return owner && r ? norm(`${owner}/${r}`) : '';
    };
    const block = () =>
        PROTECTED_REPOS.map(norm).includes(repo()) &&
        !ALLOWED_USERS.map(norm).includes(user());

    const addCSS = () => {
        if (document.getElementById('tm-issue-lock-css')) return;
        const css = document.createElement('style');
        css.id  = 'tm-issue-lock-css';
        css.textContent = `
            .tm-issue-locked,
            .tm-issue-locked:hover,
            .tm-issue-locked:focus {
                background:#d73a49 !important;
                border-color:#d73a49 !important;
                color:#fff !important;
                cursor:default !important;
            }
        `;
        document.head.appendChild(css);
    };

    const SELECTOR = `
        a[href*="/issues/new"],
        a[data-hotkey="c"],
        a.prc-Button-ButtonBase-c50BI
    `;

    const neuter = () => {
        if (!block()) return;
        addCSS();

        document.querySelectorAll(SELECTOR).forEach(el => {
            el.removeAttribute('href');
            el.setAttribute('aria-disabled', 'true');
            el.classList.add('tm-issue-locked');
            el.style.pointerEvents = 'none';
            el.title = 'New issues are restricted for your account';
        });
    };

    const pointerGuard = e => {
        if (!block()) return;
        const a = e.target.closest('a');
        if (a && /\/issues\/new/.test(a.getAttribute('href') || '')) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    };

    const init = () => {
        neuter();
        document.addEventListener('pjax:end',     neuter);
        document.addEventListener('turbo:render', neuter);
        new MutationObserver(neuter).observe(document.body, {childList:true,subtree:true});
        document.addEventListener('pointerdown', pointerGuard, true);
        document.addEventListener('click',       pointerGuard, true);
        document.addEventListener('keydown', e => {
            if (block() && e.key === 'c' && !e.ctrlKey && !e.metaKey &&
                document.activeElement === document.body) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }, true);
    };

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();
})();
