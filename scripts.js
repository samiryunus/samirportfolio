/**
 * Portfolio Site - Main JavaScript
 * Dark mode, animated project collapsibles, filters, scroll "altimeter",
 * live local clock, copy-to-clipboard, and the media viewer.
 *
 * Everything extra is built from the existing HTML (no extra files needed).
 */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // =============================
  // ICONS (only for the copy buttons created below)
  // =============================

  const svg = (inner, extra) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"' + (extra || '') + '>' + inner + '</svg>';

  const ICONS = {
    copy: svg('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>')
  };

  // =============================
  // DARK MODE TOGGLE
  // =============================

  function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    const html = document.documentElement;
    if (!toggle) return;

    let saved = null;
    try { saved = localStorage.getItem('darkMode'); } catch (e) {}
    // Default to dark on first visit (same behavior as before)
    let isDark = saved === null ? true : saved === 'true';

    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function apply(dark) {
      if (dark) html.setAttribute('data-theme', 'dark');
      else html.removeAttribute('data-theme');
      toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.setAttribute('aria-pressed', String(dark));
      if (themeMeta) themeMeta.setAttribute('content', dark ? '#111214' : '#f5f4ef');
    }

    apply(isDark);

    toggle.addEventListener('click', function () {
      isDark = html.getAttribute('data-theme') !== 'dark';
      html.classList.add('theme-transition');
      apply(isDark);
      try { localStorage.setItem('darkMode', String(isDark)); } catch (e) {}
      window.setTimeout(() => html.classList.remove('theme-transition'), 450);
    });
  }

  // =============================
  // PROJECT COLLAPSIBLES (animated)
  // =============================

  function projectParts(project) {
    return { header: project.querySelector('.project-header'), body: project.querySelector('.project-body') };
  }

  function setProjectOpen(project, open, animate) {
    const { header, body } = projectParts(project);
    if (!body) return;
    const isOpen = !project.classList.contains('collapsed');
    if (isOpen === open) return;

    if (body._anim) { body._anim.cancel(); body._anim = null; }
    const canAnimate = animate !== false && !reduceMotion && typeof body.animate === 'function';

    if (open) {
      project.classList.remove('collapsed');
      if (header) header.setAttribute('aria-expanded', 'true');
      if (!canAnimate) return;
      const h = body.scrollHeight;
      const pb = parseFloat(getComputedStyle(body).paddingBottom) || 0;
      body._anim = body.animate(
        [
          { height: '0px', paddingBottom: '0px', opacity: 0, overflow: 'hidden', visibility: 'visible' },
          { height: h + 'px', paddingBottom: pb + 'px', opacity: 1, overflow: 'hidden', visibility: 'visible' }
        ],
        { duration: 520, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
      );
      body._anim.onfinish = () => { body._anim = null; };
    } else {
      const h = body.offsetHeight;
      const pb = parseFloat(getComputedStyle(body).paddingBottom) || 0;
      project.classList.add('collapsed');
      if (header) header.setAttribute('aria-expanded', 'false');
      if (!canAnimate) return;
      body._anim = body.animate(
        [
          { height: h + 'px', paddingBottom: pb + 'px', opacity: 1, overflow: 'hidden', visibility: 'visible' },
          { height: '0px', paddingBottom: '0px', opacity: 0, overflow: 'hidden', visibility: 'visible' }
        ],
        { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      );
      body._anim.onfinish = () => { body._anim = null; };
    }
  }

  function initProjectCollapsibles() {
    const projects = document.querySelectorAll('.project');

    // Start with ALL projects collapsed
    projects.forEach((project, i) => {
      project.classList.add('collapsed');
      const { header, body } = projectParts(project);
      if (body && !body.id) body.id = 'project-body-' + (i + 1);
      if (header) {
        header.setAttribute('aria-expanded', 'false');
        if (body) header.setAttribute('aria-controls', body.id);
      }
    });

    function toggleForHeader() {
      const project = this.closest('.project');
      if (!project) return;
      setProjectOpen(project, project.classList.contains('collapsed'));
    }

    document.querySelectorAll('.project-header').forEach(header => {
      header.addEventListener('click', toggleForHeader);
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleForHeader.call(this, e);
        }
      });
    });

    // Open a project from the URL, e.g. index.html#project-01
    function openFromHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (target && target.classList.contains('project')) scrollToProject(id);
    }
    window.addEventListener('hashchange', openFromHash);
    if (location.hash) window.setTimeout(openFromHash, 350);
  }

  // =============================
  // FEATURED PROJECT SCROLL
  // =============================

  function scrollToProject(projectId) {
    const project = document.getElementById(projectId);
    if (!project) return;

    // Make sure a filter isn't hiding it
    if (project.hidden) {
      const all = document.querySelector('.filter-btn[data-filter="all"]');
      if (all) all.click();
    }
    setProjectOpen(project, true);

    window.setTimeout(() => {
      project.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, 120);
  }

  // Make scrollToProject globally available (used by inline onclick)
  window.scrollToProject = scrollToProject;

  // Click handler for hero metric buttons: animate, then scroll
  function heroMetricClick(buttonEl) {
    if (!buttonEl) return;
    buttonEl.classList.remove('metric-ping');
    void buttonEl.offsetWidth;
    buttonEl.classList.add('metric-ping');
    scrollToProject('project-01');
  }
  window.heroMetricClick = heroMetricClick;

  // =============================
  // PROJECT FILTERS + EXPAND ALL
  // =============================

  function initProjectTools() {
    const timeline = document.querySelector('.timeline');
    const projects = Array.from(document.querySelectorAll('.project'));
    if (!timeline || !projects.length) return;

    // Section count next to the "Projects" heading
    const h2 = document.querySelector('.content-header h2');
    if (h2) {
      const count = document.createElement('span');
      count.className = 'count';
      count.setAttribute('aria-hidden', 'true');
      count.textContent = String(projects.length).padStart(2, '0');
      h2.after(count);
    }

    const FILTERS = [
      ['all', 'All'],
      ['aerospace', 'Aerospace'],
      ['simulation', 'Simulation'],
      ['hardware', 'Hardware'],
      ['research', 'Research']
    ];

    const bar = document.createElement('div');
    bar.className = 'timeline-tools';

    const group = document.createElement('div');
    group.className = 'filter-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Filter projects');

    FILTERS.forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-btn';
      btn.dataset.filter = key;
      btn.textContent = label;
      btn.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false');
      group.appendChild(btn);
    });

    const right = document.createElement('div');
    right.className = 'tools-right';
    const status = document.createElement('span');
    status.className = 'tools-count';
    status.setAttribute('aria-live', 'polite');
    const toggleAll = document.createElement('button');
    toggleAll.type = 'button';
    toggleAll.className = 'tools-toggle';
    toggleAll.textContent = 'Expand all';
    right.append(status, toggleAll);

    bar.append(group, right);
    timeline.before(bar);

    function visibleProjects() { return projects.filter(p => !p.hidden); }

    function refreshStatus() {
      const vis = visibleProjects();
      status.textContent = vis.length + (vis.length === 1 ? ' entry' : ' entries');
      const anyOpen = vis.some(p => !p.classList.contains('collapsed'));
      toggleAll.textContent = anyOpen ? 'Collapse all' : 'Expand all';
    }

    function applyFilter(key) {
      group.querySelectorAll('.filter-btn').forEach(b =>
        b.setAttribute('aria-pressed', String(b.dataset.filter === key)));

      projects.forEach(p => {
        const tags = (p.dataset.tags || '').split(/\s+/);
        const match = key === 'all' || tags.includes(key);
        p.hidden = !match;
      });
      refreshStatus();
    }

    group.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (btn) applyFilter(btn.dataset.filter);
    });

    toggleAll.addEventListener('click', () => {
      const vis = visibleProjects();
      const open = !vis.some(p => !p.classList.contains('collapsed'));
      vis.forEach((p, i) => window.setTimeout(() => { setProjectOpen(p, open); refreshStatus(); }, i * 70));
    });

    // Keep the label in sync when individual projects are toggled
    timeline.addEventListener('click', () => window.setTimeout(refreshStatus, 30));
    timeline.addEventListener('keyup', () => window.setTimeout(refreshStatus, 30));

    refreshStatus();
  }

  // =============================
  // SCROLL REVEAL
  // =============================





  // =============================
  // SCROLL FEEDBACK: progress bar + "altimeter"
  // (page scroll maps to 0 → 10,000 ft, the air-brake apogee target)
  // =============================

  function initScrollFeedback() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');

    const alt = document.createElement('button');
    alt.type = 'button';
    alt.className = 'altimeter';
    alt.setAttribute('aria-label', 'Back to top');
    alt.innerHTML =
      '<span class="altimeter-label">ALT</span>' +
      '<span class="altimeter-value">0</span>' +
      '<span class="altimeter-unit">ft</span>' +
      '<span class="altimeter-track" aria-hidden="true"><i></i></span>';
    document.body.append(bar, alt);

    const label = alt.querySelector('.altimeter-label');
    const value = alt.querySelector('.altimeter-value');

    let target = 0;
    let shown = 0;
    let running = false;

    function measure() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.setProperty('--p', target.toFixed(4));
      alt.classList.toggle('is-visible', window.scrollY > 160);
      if (!running) { running = true; requestAnimationFrame(step); }
    }

    function step() {
      const diff = target - shown;
      shown = Math.abs(diff) < 0.0004 || reduceMotion ? target : shown + diff * 0.14;
      const feet = Math.round(shown * 10000);
      value.textContent = feet.toLocaleString('en-US');
      alt.style.setProperty('--p', shown.toFixed(4));
      const apogee = shown > 0.992;
      alt.classList.toggle('is-apogee', apogee);
      label.textContent = apogee ? 'APOGEE' : 'ALT';
      if (shown !== target) requestAnimationFrame(step);
      else running = false;
    }

    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    alt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    measure();
  }

  // =============================
  // CARD SPOTLIGHT (soft highlight follows the cursor)
  // =============================



  // =============================
  // LIVE LOCAL TIME
  // =============================

  function initLiveClock() {
    const host = document.querySelector('.hero-location-text');
    if (!host) return;
    let fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      });
    } catch (e) { return; }

    const el = document.createElement('span');
    el.className = 'hero-clock';
    el.innerHTML = '<i class="live-dot"></i><time></time>';
    host.appendChild(el);
    const time = el.querySelector('time');

    function tick() {
      const next = fmt.format(new Date()) + ' · local time';
      if (time.textContent !== next) time.textContent = next;
    }
    tick();
    window.setInterval(tick, 5000);
  }

  // =============================
  // COPY-TO-CLIPBOARD (email + phone) + TOAST
  // =============================

  let toastTimer;
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  function initCopyButtons() {
    const contact = document.querySelector('.sidebar .contact');
    if (!contact) return;

    const targets = [];
    const phone = contact.querySelector('strong');
    const mail = contact.querySelector('a[href^="mailto:"]');
    if (phone) targets.push({ node: phone, text: phone.textContent.trim(), label: 'Phone number' });
    if (mail) targets.push({ node: mail, text: mail.textContent.trim(), label: 'Email' });

    targets.forEach(({ node, text, label }) => {
      const host = node.parentElement;
      host.classList.add('contact-line');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copy ' + label.toLowerCase());
      btn.innerHTML = ICONS.copy;
      host.appendChild(btn);

      btn.addEventListener('click', () => {
        copyText(text).then(() => {
          btn.classList.add('is-done');
          btn.innerHTML = ICONS.check;
          showToast(label + ' copied');
          setTimeout(() => { btn.classList.remove('is-done'); btn.innerHTML = ICONS.copy; }, 1500);
        }).catch(() => showToast('Press and hold to copy'));
      });
    });
  }

  // =============================
  // INITIALIZATION
  // =============================

  document.addEventListener('DOMContentLoaded', function () {
    initDarkMode();
    initProjectCollapsibles();
    initProjectTools();
    initScrollFeedback();
    initLiveClock();
    initCopyButtons();
    initMediaModal();

    // Videos: only fetch metadata until played
    document.querySelectorAll('video').forEach(v => { v.preload = 'metadata'; });
    // Images inside collapsed projects can wait
    document.querySelectorAll('.project-media img').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
  });

  // =============================
  // MEDIA MODAL (CLICK-TO-EXPAND)
  // =============================

  function initMediaModal() {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('media-modal-content');
    const counter = document.getElementById('media-modal-counter');
    const nextBtn = modal ? modal.querySelector('[data-modal-next]') : null;
    const prevBtn = modal ? modal.querySelector('[data-modal-prev]') : null;
    const closeBtn = modal ? modal.querySelector('[data-modal-close]') : null;

    if (!modal || !content) return;

    // Caption (uses each image's alt text)
    const caption = document.createElement('div');
    caption.className = 'media-modal-caption';
    caption.setAttribute('aria-hidden', 'true');
    modal.appendChild(caption);

    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Media viewer');

    let galleryItems = [];
    let currentIndex = 0;
    let lastFocus = null;
    let touchStartX = 0;
    let touchStartY = 0;

    function collectGalleryItems(clickedNode) {
      const gallery = clickedNode.closest('.project-media, .featured-media');
      const selector = 'img, video';
      return gallery ? Array.from(gallery.querySelectorAll(selector)) : [clickedNode];
    }

    function stopCurrentMedia() {
      const activeVideo = content.querySelector('video');
      if (activeVideo) {
        try {
          activeVideo.pause();
          activeVideo.currentTime = 0;
        } catch (e) {}
      }
    }

    function renderCurrentItem() {
      stopCurrentMedia();
      const node = galleryItems[currentIndex];
      if (!node) return;

      content.innerHTML = '';

      let clone;
      if (node.tagName.toLowerCase() === 'video') {
        clone = document.createElement('video');
        clone.controls = true;
        clone.playsInline = true;
        clone.setAttribute('playsinline', '');
        clone.setAttribute('webkit-playsinline', '');
        clone.preload = 'metadata';

        const poster = node.getAttribute('poster');
        if (poster) clone.poster = poster;

        const sources = node.querySelectorAll('source');
        if (sources.length) {
          sources.forEach(srcEl => {
            if (srcEl.getAttribute('src')) {
              const source = document.createElement('source');
              source.src = srcEl.getAttribute('src');
              source.type = srcEl.getAttribute('type') || 'video/mp4';
              clone.appendChild(source);
            }
          });
        } else if (node.getAttribute('src')) {
          clone.src = node.getAttribute('src');
        }
        // No forced autoplay: keeps iOS/Android behavior predictable.
      } else {
        clone = document.createElement('img');
        clone.alt = node.getAttribute('alt') || 'Expanded image';
        clone.src = node.getAttribute('src');
        clone.loading = 'eager';
      }

      content.appendChild(clone);
      caption.textContent = node.getAttribute('alt') || '';

      const isMulti = galleryItems.length > 1;
      modal.classList.toggle('has-multiple', isMulti);

      if (nextBtn) nextBtn.disabled = !isMulti;
      if (prevBtn) prevBtn.disabled = !isMulti;

      if (counter) {
        counter.textContent = isMulti ? `${currentIndex + 1} / ${galleryItems.length}` : '';
        counter.style.display = isMulti ? '' : 'none';
      }

      // Warm the cache for the neighbours so next/prev feels instant
      if (isMulti) {
        [1, -1].forEach(d => {
          const n = galleryItems[(currentIndex + d + galleryItems.length) % galleryItems.length];
          if (n && n.tagName.toLowerCase() === 'img') new Image().src = n.getAttribute('src');
        });
      }
    }

    function openModalWithNode(node) {
      lastFocus = document.activeElement;
      galleryItems = collectGalleryItems(node);
      currentIndex = Math.max(0, galleryItems.indexOf(node));
      renderCurrentItem();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function closeModal() {
      stopCurrentMedia();
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      content.innerHTML = '';
      document.body.classList.remove('modal-open');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }

    function showNext() {
      if (galleryItems.length < 2) return;
      currentIndex = (currentIndex + 1) % galleryItems.length;
      renderCurrentItem();
    }

    function showPrev() {
      if (galleryItems.length < 2) return;
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      renderCurrentItem();
    }

    modal.addEventListener('click', (e) => {
      if (e.target && e.target.closest('[data-modal-close]')) return closeModal();
      if (e.target && e.target.closest('[data-modal-next]')) return showNext();
      if (e.target && e.target.closest('[data-modal-prev]')) return showPrev();
      if (e.target === modal || e.target === content) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    });

    // Swipe support for phones/tablets.
    content.addEventListener('touchstart', (e) => {
      if (!e.changedTouches.length) return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      if (!e.changedTouches.length) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) showNext();
        else showPrev();
      }
    }, { passive: true });

    document.querySelectorAll('.project-media img, .project-media video, .featured-media img, .featured-media video').forEach(el => {
      const isVideo = el.tagName.toLowerCase() === 'video';
      el.style.cursor = 'zoom-in';

      if (!isVideo) {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModalWithNode(el); }
        });
      }

      el.addEventListener('click', (e) => {
        if (isVideo) {
          // Let the native controls (bottom of the player) work normally
          const rect = el.getBoundingClientRect();
          const y = e.clientY - rect.top;
          if (y > rect.height * 0.78) return;
        }
        openModalWithNode(el);
      });
    });
  }
})();
