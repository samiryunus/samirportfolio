document.addEventListener('DOMContentLoaded', function () {
  const headers = document.querySelectorAll('.project-header');

  function toggleForHeader() {
    const project = this.closest('.project');
    if (!project) return;
    // Toggle collapsed class: when present -> collapsed (closed)
    const nowCollapsed = project.classList.toggle('collapsed');
    // aria-expanded should reflect whether the panel is open
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
});
