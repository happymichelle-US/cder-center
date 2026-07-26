/* Shared behaviours for the CDER Center and Exemplar PDC sites.
   - hash routing between <section class="view"> panes (with View Transitions)
   - theme toggle (respects system preference, remembers within the session)
   - responsive nav disclosure
   No dependencies. */

(() => {
  'use strict';

  /* ------------------------------------------------------------ theming -- */
  const root = document.documentElement;
  /* Defensive: some embedded/headless runtimes lack matchMedia. */
  const mq = (q) => (typeof window.matchMedia === 'function'
    ? window.matchMedia(q)
    : { matches: false, media: q, addEventListener() {}, removeEventListener() {} });
  const prefersDark = mq('(prefers-color-scheme: dark)');
  const reducedMotion = () => mq('(prefers-reduced-motion: reduce)').matches;

  const applyTheme = (mode) => {
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.setAttribute('aria-label',
      mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };

  let theme = prefersDark.matches ? 'dark' : 'light';
  applyTheme(theme);
  prefersDark.addEventListener('change', (e) => {
    if (!root.dataset.themeLocked) applyTheme(e.matches ? 'dark' : 'light');
  });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme-toggle]');
    if (!t) return;
    theme = root.classList.contains('dark') ? 'light' : 'dark';
    root.dataset.themeLocked = 'true';
    applyTheme(theme);
  });

  /* ---------------------------------------------------------------- nav -- */
  const nav = document.querySelector('.primary-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const closeNav = () => {
    if (!nav) return;
    delete nav.dataset.open;
    navToggle?.setAttribute('aria-expanded', 'false');
  };
  navToggle?.addEventListener('click', () => {
    const open = nav.hasAttribute('data-open');
    if (open) closeNav();
    else { nav.dataset.open = ''; navToggle.setAttribute('aria-expanded', 'true'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  /* ------------------------------------------------------------- router -- */
  const views = [...document.querySelectorAll('.view')];
  const main = document.getElementById('content');
  const titleBase = document.title.split(' · ').pop();

  const show = (id, { focus = false } = {}) => {
    const target = views.find((v) => v.id === id) || views[0];
    const run = () => {
      views.forEach((v) => v.toggleAttribute('data-active', v === target));
      document.querySelectorAll('.nav-link').forEach((a) => {
        const match = a.getAttribute('href') === `#${target.id}`;
        if (match) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      const label = target.dataset.title || target.id;
      document.title = `${label} · ${titleBase}`;
    };

    if (document.startViewTransition && !reducedMotion()) {
      document.startViewTransition(run);
    } else { run(); }

    closeNav();
    if (focus) {
      main?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  };

  const routeFromHash = (focus) => {
    const id = location.hash.replace('#', '');
    if (!id) return show(views[0]?.id, { focus });
    // deep link to an element inside a view, e.g. #resources.library
    const [viewId, anchor] = id.split('.');
    if (views.some((v) => v.id === viewId)) {
      show(viewId, { focus });
      if (anchor) {
        requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }));
      }
    } else {
      const el = document.getElementById(id);
      const owner = el?.closest('.view');
      if (owner) { show(owner.id, { focus: false }); requestAnimationFrame(() => el.scrollIntoView({ block: 'start' })); }
      else show(views[0]?.id, { focus });
    }
  };

  if (views.length) {
    routeFromHash(false);
    addEventListener('hashchange', () => routeFromHash(true));
  }

  /* ------------------------------------------- keyboard shortcut: search */
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      const input = document.querySelector('[data-search-primary]');
      if (input) {
        e.preventDefault();
        const owner = input.closest('.view');
        if (owner && !owner.hasAttribute('data-active')) location.hash = owner.id;
        requestAnimationFrame(() => input.focus());
      }
    }
  });

  /* ------------------------------------------------- generic year stamp -- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
