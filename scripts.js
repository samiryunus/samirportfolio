/**
 * Portfolio Site - Main JavaScript
 * Handles dark mode toggle, project collapsibles, and interactions
 */

// =============================
// DARK MODE TOGGLE
// =============================

function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const htmlElement = document.documentElement;

  if (!darkModeToggle) return;

  // Check for saved dark mode preference; default to dark mode on first visit
  let isDarkMode;
  const savedPreference = localStorage.getItem('darkMode');

  if (savedPreference !== null) {
    // Use saved preference if available
    isDarkMode = savedPreference === 'true';
  } else {
    // Default to dark mode on initial load
    isDarkMode = true;
  }

  if (isDarkMode) {
    htmlElement.setAttribute('data-theme', 'dark');
    darkModeToggle.textContent = '☀️';
  } else {
    htmlElement.removeAttribute('data-theme');
    darkModeToggle.textContent = '🌙';
  }

  darkModeToggle.addEventListener('click', function() {
    const isCurrentlyDark = htmlElement.getAttribute('data-theme') === 'dark';
    if (isCurrentlyDark) {
      htmlElement.removeAttribute('data-theme');
      darkModeToggle.textContent = '🌙';
      localStorage.setItem('darkMode', 'false');
    } else {
      htmlElement.setAttribute('data-theme', 'dark');
      darkModeToggle.textContent = '☀️';
      localStorage.setItem('darkMode', 'true');
    }
  });
}

// =============================
// PROJECT COLLAPSIBLES
// =============================

function initProjectCollapsibles() {
  const projects = document.querySelectorAll('.project');
  const headers = document.querySelectorAll('.project-header');

  // Start with ALL projects collapsed
  projects.forEach(project => {
    project.classList.add('collapsed');
    const header = project.querySelector('.project-header');
    if (header) {
      header.setAttribute('aria-expanded', 'false');
    }
  });

  // Toggle behavior
  function toggleForHeader() {
    const project = this.closest('.project');
    if (!project) return;
    const nowCollapsed = project.classList.toggle('collapsed');
    this.setAttribute('aria-expanded', String(!nowCollapsed));
  }

  headers.forEach(header => {
    header.addEventListener('click', toggleForHeader);
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleForHeader.call(this, e);
      }
    });
  });
}

// =============================
// FEATURED PROJECT SCROLL
// =============================

function scrollToProject(projectId) {
  const project = document.getElementById(projectId);
  if (project) {
    // Expand the project if it's collapsed
    if (project.classList.contains('collapsed')) {
      const header = project.querySelector('.project-header');
      if (header) {
        header.click();
      }
    }
    // Smooth scroll to the project
    setTimeout(() => {
      project.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }
}


// Make scrollToProject globally available
window.scrollToProject = scrollToProject;

// Click handler for hero metric buttons: animate, then scroll
function heroMetricClick(buttonEl) {
  if (!buttonEl) return;
  // restart animation
  buttonEl.classList.remove('metric-ping');
  // force reflow to allow retrigger
  void buttonEl.offsetWidth;
  buttonEl.classList.add('metric-ping');
  scrollToProject('project-01');
}

// Expose for inline onclick
window.heroMetricClick = heroMetricClick;



// =============================
// SCROLL REVEAL
// =============================

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('reveal-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  elements.forEach(el => observer.observe(el));
}

// =============================
// INITIALIZATION
// =============================

document.addEventListener('DOMContentLoaded', function () {
  initScrollReveal();
  initDarkMode();
  initProjectCollapsibles();
  initMediaModal();
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

  if (!modal || !content) return;

  let galleryItems = [];
  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

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

      // Do not force autoplay on phones/tablets. It keeps iOS/Android behavior predictable.
    } else {
      clone = document.createElement('img');
      clone.alt = node.getAttribute('alt') || 'Expanded image';
      clone.src = node.getAttribute('src');
      clone.loading = 'eager';
    }

    content.appendChild(clone);

    const isMulti = galleryItems.length > 1;
    modal.classList.toggle('has-multiple', isMulti);

    if (nextBtn) nextBtn.disabled = !isMulti;
    if (prevBtn) prevBtn.disabled = !isMulti;

    if (counter) {
      counter.textContent = isMulti ? `${currentIndex + 1} / ${galleryItems.length}` : '';
    }
  }

  function openModalWithNode(node) {
    galleryItems = collectGalleryItems(node);
    currentIndex = Math.max(0, galleryItems.indexOf(node));
    renderCurrentItem();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    stopCurrentMedia();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    content.innerHTML = '';
    document.body.classList.remove('modal-open');
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
    if (e.target && e.target.matches('[data-modal-close]')) closeModal();
    if (e.target && e.target.matches('[data-modal-next]')) showNext();
    if (e.target && e.target.matches('[data-modal-prev]')) showPrev();
    if (e.target === modal) closeModal();
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
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) showNext();
      else showPrev();
    }
  }, { passive: true });

  document.querySelectorAll('.project-media img, .project-media video, .featured-media img, .featured-media video').forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', (e) => {
      if (el.tagName.toLowerCase() === 'video') {
        const rect = el.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y > rect.height * 0.78) return;
      }
      openModalWithNode(el);
    });
  });
}

// =============================
// INITIALIZATION (append)
// =============================
