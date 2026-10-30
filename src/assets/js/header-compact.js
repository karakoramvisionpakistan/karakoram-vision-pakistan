/* Neeche scroll karte hi header simat jata hai: oopar wali maloomat ki
   patti chhup jati hai, logo chhota ho jata hai, menu apni jagah rehta hai.
   Safha parhte waqt poora chauthai screen header nahi khata. */
(() => {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  let waiting = false;
  const apply = () => {
    header.classList.toggle('is-compact', window.scrollY > 140);
    waiting = false;
  };

  window.addEventListener('scroll', () => {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(apply);
  }, { passive: true });

  apply();
})();
