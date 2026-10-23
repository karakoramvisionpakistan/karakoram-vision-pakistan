// Sends the website forms (trip request, guest review) without leaving the page and shows a clear result message.
(() => {
  const forms = document.querySelectorAll('form[data-trip-planner], form[data-site-form]');
  if (!forms.length) return;

  forms.forEach((form) => {
    const isReview = form.hasAttribute('data-review-form');
    const OK = form.getAttribute('data-success') || (isReview
      ? 'Thank you! Your review has been received. Our team will check it and may publish it on this page.'
      : 'Thank you! Your trip request has been sent. Our team will contact you soon.');
    const BAD = 'Sorry, it could not be sent. Please try again, or contact us on WhatsApp.';

    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    status.style.cssText = 'margin:0 0 16px;padding:14px 18px;border-radius:12px;font-weight:600;line-height:1.5;';
    form.parentNode.insertBefore(status, form);

    const show = (message, ok) => {
      status.textContent = message;
      status.hidden = false;
      status.style.background = ok ? '#ecfdf3' : '#fef2f2';
      status.style.color = ok ? '#065f46' : '#991b1b';
      status.style.border = `1px solid ${ok ? '#a7f3d0' : '#fecaca'}`;
      status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // hidden anti-spam field: people never see or fill it
    const trap = document.createElement('input');
    trap.type = 'text'; trap.name = '_hp'; trap.tabIndex = -1; trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(trap);

    const params = new URLSearchParams(location.search);
    if (params.has('sent')) show(OK, true);
    else if (params.has('error')) show(BAD, false);

    form.addEventListener('submit', async (event) => {
      if (!window.fetch || !window.FormData) return; // old browsers: normal form post still works
      event.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      const button = form.querySelector('[type="submit"]');
      const label = button && button.textContent;
      if (button) { button.disabled = true; button.textContent = 'Sending...'; }
      try {
        const response = await fetch(form.getAttribute('action'), {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new URLSearchParams(new FormData(form)),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.ok) { form.reset(); show(OK, true); } else { show(BAD, false); }
      } catch {
        show(BAD, false);
      } finally {
        if (button) { button.disabled = false; button.textContent = label; }
      }
    });
  });
})();
