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
  if (!modal || !content) return;

  function openModalWithNode(node) {
    // Clear previous
    content.innerHTML = '';

    // Clone node safely
    let clone;
    if (node.tagName.toLowerCase() === 'video') {
      clone = document.createElement('video');
      clone.controls = true;
      clone.playsInline = true;
      clone.preload = 'metadata';

      // Copy first <source> (simple + reliable)
      const srcEl = node.querySelector('source');
      if (srcEl && srcEl.getAttribute('src')) {
        const source = document.createElement('source');
        source.src = srcEl.getAttribute('src');
        source.type = srcEl.getAttribute('type') || 'video/mp4';
        clone.appendChild(source);
      } else if (node.getAttribute('src')) {
        clone.src = node.getAttribute('src');
      }

      // Start playing after open (user gesture came from click)
      setTimeout(() => {
        try { clone.play(); } catch (e) {}
      }, 0);
    } else {
      clone = document.createElement('img');
      clone.alt = node.getAttribute('alt') || 'Expanded image';
      clone.src = node.getAttribute('src');
    }

    content.appendChild(clone);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    content.innerHTML = '';
    document.body.style.overflow = '';
  }

  // Close buttons / backdrop
  modal.addEventListener('click', (e) => {
    if (e.target && e.target.matches('[data-modal-close]')) closeModal();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  // Click any project media to open
  document.querySelectorAll('.project-media img, .project-media video, .featured-media img, .featured-media video').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't open modal if user is interacting with controls inside a video
      if (el.tagName.toLowerCase() === 'video') {
        const rect = el.getBoundingClientRect();
        const y = e.clientY - rect.top;
        // If click is in lower area (controls region), allow normal controls
        if (y > rect.height * 0.80) return;
      }
      openModalWithNode(el);
    });
  });
}

// =============================
// INITIALIZATION (append)
// =============================
