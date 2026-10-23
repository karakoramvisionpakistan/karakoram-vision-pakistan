// Shows the reviews that the client has published (loaded from /api/reviews).
(() => {
  const list = document.querySelector('[data-reviews-list]');
  if (!list) return;
  const empty = document.querySelector('[data-reviews-empty]');

  const el = (tag, css, text) => {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text != null) node.textContent = text;
    return node;
  };

  fetch('/api/reviews', { headers: { Accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : { reviews: [] }))
    .catch(() => ({ reviews: [] }))
    .then((data) => {
      const reviews = (data && data.reviews) || [];
      if (!reviews.length) { if (empty) empty.hidden = false; return; }

      reviews.forEach((r) => {
        const card = el('article', 'background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;box-shadow:0 1px 2px rgba(15,23,42,.05);display:flex;flex-direction:column;gap:10px;');
        const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
        const stars = el('div', 'color:#f59e0b;font-size:18px;letter-spacing:2px;', '★'.repeat(rating) + '☆'.repeat(5 - rating));
        stars.setAttribute('aria-label', `${rating} out of 5 stars`);
        card.appendChild(stars);
        card.appendChild(el('p', 'color:#334155;line-height:1.65;margin:0;white-space:pre-line;', r.review));
        const who = [r.first_name, r.country].filter(Boolean).join(', ');
        card.appendChild(el('p', 'font-weight:800;margin:6px 0 0;color:#0f172a;', who));
        const trip = [r.journey, r.travel_date].filter(Boolean).join(' · ');
        if (trip) card.appendChild(el('p', 'font-size:13px;color:#64748b;margin:0;', trip));
        list.appendChild(card);
      });
    });
})();
