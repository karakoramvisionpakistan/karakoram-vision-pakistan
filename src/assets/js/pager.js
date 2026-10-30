/* Cards ki qatar ko safhon mein dikhata hai.
   Saare cards HTML mein mojood rehte hain — sirf nazar badalti hai. */
(() => {
  const ON = ['border-orange-500', 'bg-orange-500', 'text-white'];
  const OFF = ['border-slate-300', 'bg-white', 'text-slate-700'];

  document.querySelectorAll('[data-card-pager]').forEach((pager) => {
    const pages = Array.from(pager.querySelectorAll('[data-pager-page]'));
    const buttons = Array.from(pager.querySelectorAll('[data-pager-go]'));
    if (pages.length < 2 || !buttons.length) return;

    const show = (n) => {
      pages.forEach((page) => { page.hidden = page.dataset.pagerPage !== String(n); });
      buttons.forEach((button) => {
        const on = button.dataset.pagerGo === String(n);
        button.setAttribute('aria-current', on ? 'true' : 'false');
        button.classList.remove(...ON, ...OFF);
        button.classList.add(...(on ? ON : OFF));
      });
      // Agar qatar ka sira screen se upar nikal gaya ho to wapas le aao
      const top = pager.getBoundingClientRect().top;
      if (top < 0) pager.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => show(button.dataset.pagerGo));
    });
  });
})();
