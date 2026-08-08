/**
 * Interactive behavior for the offline VeriWhy Check documentation website.
 * Author: Richard Krasso
 *
 * This script uses browser-native APIs only so the bundled guide needs no
 * framework, package runtime, server, or network connection. Every enhancement
 * preserves a readable Markdown-generated page when JavaScript is unavailable.
 */

(() => {
  // The private scope prevents guide variables from colliding with generated
  // search data or future scripts included on the same offline page.
  'use strict';

  const menuButton = document.querySelector('[data-menu-button]');
  const sidebar = document.querySelector('[data-sidebar]');

  // Mobile navigation synchronizes its visible state with aria-expanded so the
  // control communicates the same state to assistive technology.
  menuButton?.addEventListener('click', () => {
    const open = sidebar?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('pre').forEach((block) => {
    // Copy controls are generated only when JavaScript and Clipboard APIs are
    // available; the original code block always remains selectable by hand.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(block.textContent ?? '');
        button.textContent = 'Copied';
      } catch {
        // Clipboard permission can be unavailable on file:// pages. The fallback
        // tells the student to select text without treating it as an app error.
        button.textContent = 'Select text';
      }
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 1800);
    });
    block.append(button);
  });

  const input = document.querySelector('[data-search]');
  const panel = document.querySelector('[data-results]');
  const summary = document.querySelector('[data-search-summary]');
  const list = document.querySelector('[data-search-list]');
  const close = document.querySelector('[data-close-search]');
  const index = Array.isArray(window.VERIWHY_GUIDE_INDEX) ? window.VERIWHY_GUIDE_INDEX : [];

  // Hiding is centralized because the close button, backdrop, empty query, and
  // Escape key must all produce the same accessible panel state.
  const hideSearch = () => {
    if (panel) panel.hidden = true;
  };
  close?.addEventListener('click', hideSearch);
  panel?.addEventListener('click', (event) => {
    if (event.target === panel) hideSearch();
  });
  document.addEventListener('keydown', (event) => {
    // Escape follows dialog convention; Command/Ctrl+K mirrors familiar
    // documentation tools while remaining an optional keyboard shortcut.
    if (event.key === 'Escape') hideSearch();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input?.focus();
    }
  });

  input?.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      hideSearch();
      return;
    }
    const matches = index
      // The small client-side index intentionally performs predictable literal
      // matching. Limiting results keeps the offline panel concise and fast.
      .filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(query))
      .slice(0, 12);
    if (panel) panel.hidden = false;
    if (summary)
      summary.textContent = matches.length
        ? `${matches.length} matching guide page${matches.length === 1 ? '' : 's'}`
        : 'No guide pages match that search.';
    if (list) {
      // Build result elements with DOM APIs and textContent rather than injecting
      // HTML, preserving the same escaping boundary used by the documentation builder.
      list.replaceChildren(
        ...matches.map((item) => {
          const entry = document.createElement('li');
          const link = document.createElement('a');
          const detail = document.createElement('span');
          link.href = item.page;
          link.textContent = item.title;
          detail.textContent = item.text.slice(0, 150);
          link.append(detail);
          entry.append(link);
          return entry;
        })
      );
    }
  });
})();
