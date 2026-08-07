/**
 * Interactive behavior for the offline VeriWhy Check documentation website.
 * Author: Richard Krasso
 */

(() => {
  'use strict';

  const menuButton = document.querySelector('[data-menu-button]');
  const sidebar = document.querySelector('[data-sidebar]');
  menuButton?.addEventListener('click', () => {
    const open = sidebar?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('pre').forEach((block) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(block.textContent ?? '');
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select text';
      }
      window.setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    });
    block.append(button);
  });

  const input = document.querySelector('[data-search]');
  const panel = document.querySelector('[data-results]');
  const summary = document.querySelector('[data-search-summary]');
  const list = document.querySelector('[data-search-list]');
  const close = document.querySelector('[data-close-search]');
  const index = Array.isArray(window.VERIWHY_GUIDE_INDEX) ? window.VERIWHY_GUIDE_INDEX : [];

  const hideSearch = () => {
    if (panel) panel.hidden = true;
  };
  close?.addEventListener('click', hideSearch);
  panel?.addEventListener('click', (event) => {
    if (event.target === panel) hideSearch();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideSearch();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      input?.focus();
    }
  });

  input?.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) { hideSearch(); return; }
    const matches = index.filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(query)).slice(0, 12);
    if (panel) panel.hidden = false;
    if (summary) summary.textContent = matches.length ? `${matches.length} matching guide page${matches.length === 1 ? '' : 's'}` : 'No guide pages match that search.';
    if (list) {
      list.replaceChildren(...matches.map((item) => {
        const entry = document.createElement('li');
        const link = document.createElement('a');
        const detail = document.createElement('span');
        link.href = item.page;
        link.textContent = item.title;
        detail.textContent = item.text.slice(0, 150);
        link.append(detail);
        entry.append(link);
        return entry;
      }));
    }
  });
})();
