(() => {
  const search = document.querySelector('.search-bar');
  search?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = new FormData(search).get('query')?.toString().trim().toLowerCase() || '';
    const cards = [...document.querySelectorAll('[data-search-title]')];
    let visible = 0;
    for (const card of cards) {
      const match = card.dataset.searchTitle.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    }
    const result = document.querySelector('.result-count');
    if (result)
      result.textContent = `${visible} result${visible === 1 ? '' : 's'} for “${query || 'all'}”`;
  });

  for (const button of document.querySelectorAll('[data-watchlist]')) {
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') === 'true';
      button.setAttribute('aria-pressed', String(!active));
      button.textContent = active ? '＋ Watchlist' : '✓ In watchlist';
    });
  }
  for (const button of document.querySelectorAll('[data-remove]')) {
    button.addEventListener('click', () => button.closest('article')?.remove());
  }

  const dialog = document.querySelector('[data-trailer-dialog]');
  document.querySelector('[data-trailer]')?.addEventListener('click', () => dialog?.showModal());
  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog?.close());

  document.querySelector('[data-login-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('.form-status');
    if (status) status.textContent = 'Signed in. Returning to Cinema…';
  });
})();
