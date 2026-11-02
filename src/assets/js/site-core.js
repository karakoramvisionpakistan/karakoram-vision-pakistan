(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const closeDesktopMenus = (except = null) => {
    qsa('[data-nav-menu].is-open').forEach(menu => {
      if (menu === except) return;
      menu.classList.remove('is-open');
      qs(':scope > [data-nav-toggle]', menu)?.setAttribute('aria-expanded', 'false');
      qsa('.bk-submenu-item.is-open', menu).forEach(item => {
        item.classList.remove('is-open');
        qs(':scope > [data-submenu-trigger]', item)?.setAttribute('aria-expanded', 'false');
      });
    });
  };

  const markCurrentNavigation = () => {
    const path = location.pathname.replace(/index\.html$/, '');
    qsa('.bk-nav-link, .bk-submenu-link, .bk-mobile-nav a').forEach(link => {
      const href = new URL(link.href, location.href).pathname.replace(/index\.html$/, '');
      if (href !== '/' && path.startsWith(href)) link.classList.add('is-current');
      if (href === '/' && path === '/') link.classList.add('is-current');
    });
  };

  const initNavigation = () => {
    qsa('[data-nav-menu]').forEach(menu => {
      const toggle = qs(':scope > [data-nav-toggle]', menu);
      toggle?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const next = !menu.classList.contains('is-open');
        closeDesktopMenus(menu);
        menu.classList.toggle('is-open', next);
        toggle.setAttribute('aria-expanded', String(next));
      });
    });

    qsa('[data-submenu-trigger]').forEach(trigger => {
      trigger.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const item = trigger.closest('.bk-submenu-item');
        const parent = item?.parentElement;
        parent?.querySelectorAll(':scope > .bk-submenu-item.is-open').forEach(other => {
          if (other !== item) {
            other.classList.remove('is-open');
            qs(':scope > [data-submenu-trigger]', other)?.setAttribute('aria-expanded', 'false');
          }
        });
        const next = !item?.classList.contains('is-open');
        item?.classList.toggle('is-open', next);
        trigger.setAttribute('aria-expanded', String(next));
      });
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('[data-nav-menu]')) closeDesktopMenus();
    });
    markCurrentNavigation();
  };

  const initHeroSliders = () => {
    qsa('[data-hero-slider]').forEach(slider => {
      const slides = qsa('[data-hero-slide]', slider);
      const dots = qsa('[data-hero-dot]', slider);
      if (slides.length < 2) return;
      let active = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
      let timer = null;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const interval = Math.max(4000, Number(slider.dataset.autoplay || 6500));

      const render = next => {
        active = (next + slides.length) % slides.length;
        slides.forEach((slide, index) => {
          slide.classList.remove('is-active', 'is-prev', 'is-next');
          const previous = (active - 1 + slides.length) % slides.length;
          const following = (active + 1) % slides.length;
          if (index === active) slide.classList.add('is-active');
          else if (index === previous) slide.classList.add('is-prev');
          else if (index === following) slide.classList.add('is-next');
          slide.setAttribute('aria-hidden', String(index !== active));
          slide.toggleAttribute('inert', index !== active);
        });
        dots.forEach((dot, index) => {
          dot.classList.toggle('is-active', index === active);
          dot.setAttribute('aria-current', String(index === active));
        });
      };
      const stop = () => { if (timer) clearInterval(timer); timer = null; };
      const start = () => { if (!reduced) { stop(); timer = setInterval(() => render(active + 1), interval); } };
      qs('[data-hero-prev]', slider)?.addEventListener('click', () => { render(active - 1); start(); });
      qs('[data-hero-next]', slider)?.addEventListener('click', () => { render(active + 1); start(); });
      dots.forEach(dot => dot.addEventListener('click', () => { render(Number(dot.dataset.index || 0)); start(); }));
      slider.addEventListener('mouseenter', stop);
      slider.addEventListener('mouseleave', start);
      slider.addEventListener('focusin', stop);
      slider.addEventListener('focusout', start);
      slider.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') render(active - 1);
        if (event.key === 'ArrowRight') render(active + 1);
      });
      render(active);
      start();
    });
  };

  const initContactModal = () => {
    const modal = qs('[data-contact-modal]');
    if (!modal) return;
    let opener = null;
    const openModal = event => {
      event?.preventDefault?.();
      opener = document.activeElement;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('overflow-hidden');
      qs('[data-close-contact]', modal)?.focus();
    };
    const closeModal = () => {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('overflow-hidden');
      opener?.focus?.();
    };
    qsa('[data-open-contact]').forEach(link => link.addEventListener('click', openModal));
    qsa('[data-close-contact]', modal).forEach(button => button.addEventListener('click', closeModal));
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
  };

  const initLanguageSelector = () => {
    const select = qs('[data-language-select]');
    if (!select) return;
    select.value = 'en';
    select.addEventListener('change', () => {
      const language = select.value;
      if (!language || language === 'en') return;
      const local = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
      if (local) {
        alert('Language translation opens after the live domain is deployed. English remains active in local preview.');
        select.value = 'en';
        return;
      }
      const translated = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(language)}&u=${encodeURIComponent(location.href)}`;
      location.assign(translated);
    });
  };

  const hydrateSearchFromUrl = () => {
    if (location.pathname !== '/search/' && !location.pathname.endsWith('/search/index.html')) return;
    const form = qs('form[hx-get="/api/catalog"]');
    const target = qs('#search-results');
    if (!form || !target) return;
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const type = params.get('type') || 'all';
    const qInput = qs('[name="q"]', form);
    const typeInput = qs('[name="type"]', form);
    if (qInput) qInput.value = q;
    if (typeInput) typeInput.value = type;
    if (!q) return;
    const endpoint = `/api/catalog?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}`;
    if (window.htmx?.ajax) window.htmx.ajax('GET', endpoint, {target:'#search-results', swap:'innerHTML'});
    else fetch(endpoint).then(response => response.text()).then(html => { target.innerHTML = html; }).catch(() => {});
  };

  const prefillTripPlanner = () => {
    if (!location.pathname.includes('/plan-a-trip/')) return;
    const params = new URLSearchParams(location.search);
    const form = qs('[data-trip-planner]');
    if (!form) return;
    const mappings = {journey:'journey', service:'service', start:'start_date', end:'end_date', q:'destination', request:'request_type'};
    Object.entries(mappings).forEach(([parameter, field]) => {
      const value = params.get(parameter);
      const input = qs(`[name="${field}"]`, form);
      if (value && input) input.value = value;
    });
  };

  const linkTripDates = () => {
    qsa('form').forEach(form => {
      const start = qs('[name="start"]', form);
      const end = qs('[name="end"]', form);
      start?.addEventListener('change', () => { if (end) end.min = start.value; });
    });
  };


  const initFloatingContact = () => {
    const dock = qs('[data-contact-dock]');
    const toggle = qs('[data-contact-dock-toggle]', dock || document);
    const panel = qs('[data-contact-dock-panel]', dock || document);
    if (!dock || !toggle || !panel) return;
    const close = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); dock.classList.remove('is-open'); };
    const open = () => { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); dock.classList.add('is-open'); };
    toggle.addEventListener('click', event => { event.stopPropagation(); panel.hidden ? open() : close(); });
    qsa('[data-open-contact]', panel).forEach(button => button.addEventListener('click', close));
    document.addEventListener('click', event => { if (!dock.contains(event.target)) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  };

  const initCopyButtons = () => {
    qsa('[data-copy-text]').forEach(button => button.addEventListener('click', async () => {
      const value = button.dataset.copyText || '';
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const small = qs('small', button);
        const original = small?.textContent;
        if (small) small.textContent = 'Copied to clipboard';
        setTimeout(() => { if (small) small.textContent = original; }, 1800);
      } catch {
        window.prompt('Copy this contact ID:', value);
      }
    }));
  };

  const initTripGallery = () => {
    qsa('[data-trip-gallery]').forEach(gallery => {
      const main = qs('[data-trip-main-image]', gallery);
      const mainButton = qs('[data-trip-main-button]', gallery);
      const lightbox = qs('[data-trip-lightbox]', gallery);
      const lightboxImage = qs('[data-trip-lightbox-image]', gallery);
      const entries = [];
      const addEntry = (src, alt) => {
        if (!src || entries.some(item => item.src === src)) return;
        entries.push({src, alt: alt || 'Journey image'});
      };
      if (main) addEntry(main.currentSrc || main.src, main.alt);
      qsa('[data-trip-thumb]', gallery).forEach((thumb, index) => {
        addEntry(thumb.dataset.full, thumb.dataset.alt);
        thumb.addEventListener('click', () => {
          if (!main) return;
          main.src = thumb.dataset.full;
          main.alt = thumb.dataset.alt || main.alt;
          qsa('[data-trip-thumb]', gallery).forEach(item => item.classList.toggle('is-active', item === thumb));
          gallery.dataset.activeIndex = String(entries.findIndex(item => item.src === thumb.dataset.full));
        });
        if (thumb.classList.contains('is-active')) gallery.dataset.activeIndex = String(index);
      });
      qsa('[data-trip-gallery-open]').forEach(button => addEntry(button.dataset.full, button.dataset.alt));
      let active = Number(gallery.dataset.activeIndex || 0);
      const render = () => {
        if (!lightboxImage || !entries.length) return;
        active = (active + entries.length) % entries.length;
        lightboxImage.src = entries[active].src;
        lightboxImage.alt = entries[active].alt;
      };
      const open = index => {
        if (!lightbox || !entries.length) return;
        active = Number.isFinite(index) ? index : active;
        render();
        lightbox.hidden = false;
        document.documentElement.classList.add('overflow-hidden');
        qs('[data-trip-lightbox-close]', lightbox)?.focus();
      };
      const close = () => {
        if (!lightbox) return;
        lightbox.hidden = true;
        document.documentElement.classList.remove('overflow-hidden');
      };
      mainButton?.addEventListener('click', () => open(active));
      qsa('[data-trip-gallery-open]').forEach(button => button.addEventListener('click', () => {
        const index = entries.findIndex(item => item.src === button.dataset.full);
        open(index < 0 ? 0 : index);
      }));
      qs('[data-trip-lightbox-close]', lightbox || document)?.addEventListener('click', close);
      qs('[data-trip-lightbox-prev]', lightbox || document)?.addEventListener('click', () => { active -= 1; render(); });
      qs('[data-trip-lightbox-next]', lightbox || document)?.addEventListener('click', () => { active += 1; render(); });
      lightbox?.addEventListener('click', event => { if (event.target === lightbox) close(); });
      document.addEventListener('keydown', event => {
        if (!lightbox || lightbox.hidden) return;
        if (event.key === 'Escape') close();
        if (event.key === 'ArrowLeft') { active -= 1; render(); }
        if (event.key === 'ArrowRight') { active += 1; render(); }
      });
    });
  };

  const initTripTools = () => {
    qsa('[data-share-trip]').forEach(button => button.addEventListener('click', async () => {
      const data = {title: button.dataset.shareTitle || document.title, text: document.querySelector('meta[name="description"]')?.content || '', url: location.href};
      if (navigator.share) { try { await navigator.share(data); } catch {} }
      else { try { await navigator.clipboard.writeText(location.href); button.textContent = 'Link copied'; setTimeout(() => { button.textContent = 'Share'; }, 1600); } catch { window.prompt('Copy this page link:', location.href); } }
    }));
    qsa('[data-print-trip]').forEach(button => button.addEventListener('click', () => window.print()));
  };

  const initTripAnchorNav = () => {
    const nav = qs('[data-trip-section-nav]');
    if (!nav || !('IntersectionObserver' in window)) return;
    const links = qsa('a[href^="#"]', nav);
    const sections = links.map(link => qs(link.getAttribute('href'))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, {rootMargin:'-25% 0px -65% 0px'});
    sections.forEach(section => observer.observe(section));
  };

  const initServiceWorker = () => {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}), {once:true});
    }
  };

  const initVitals = () => {
    const endpoint = document.body?.dataset?.vitalsEndpoint;
    if (!endpoint || !('PerformanceObserver' in window)) return;
    const send = (name, value, id = '') => {
      const payload = JSON.stringify({name, value:Number(value.toFixed(2)), id, path:location.pathname, ts:Date.now()});
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([payload], {type:'application/json'}));
    };
    try { new PerformanceObserver(list => list.getEntries().forEach(entry => send('LCP', entry.startTime, entry.id || ''))).observe({type:'largest-contentful-paint', buffered:true}); } catch {}
    try { let cls = 0; new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) cls += entry.value; send('CLS', cls); }).observe({type:'layout-shift', buffered:true}); } catch {}
    try { new PerformanceObserver(list => list.getEntries().forEach(entry => send('INP', entry.duration, entry.interactionId || ''))).observe({type:'event', buffered:true, durationThreshold:40}); } catch {}
  };

  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHeroSliders();
    initContactModal();
    initFloatingContact();
    initCopyButtons();
    initTripGallery();
    initTripTools();
    initTripAnchorNav();
    initLanguageSelector();
    hydrateSearchFromUrl();
    prefillTripPlanner();
    linkTripDates();
    initServiceWorker();
    initVitals();
  }, {once:true});
})();
