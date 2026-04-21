let allBlogs = [];

function getApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // When page is opened directly from file://, route API calls to local backend.
  if (window.location.protocol === 'file:') {
    return `http://localhost:5000${normalizedPath}`;
  }

  return normalizedPath;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBlogDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function announceBlogResults(count, query = '') {
  const status = document.getElementById('blog-results-status');
  if (!status) return;

  const message = query
    ? `${count} post${count === 1 ? '' : 's'} found for "${query}".`
    : `${count} post${count === 1 ? '' : 's'} available.`;

  status.textContent = message;
}

function blogCard(blog) {
  const title = esc(blog.title || 'Untitled post');
  const description = esc(blog.description || 'No description available.');
  const imageMarkup = blog.image
    ? `<img src="${esc(blog.image)}" alt="Featured image for ${title}" class="blog-card-img" loading="lazy">`
    : '<div class="blog-card-img-placeholder" aria-hidden="true">News</div>';

  const links = [];
  if (blog.video) {
    links.push(
      `<a href="${esc(blog.video)}" target="_blank" rel="noopener" aria-label="Watch video for ${title} (opens in a new tab)">Watch Video</a>`
    );
  }
  if (blog.social_link) {
    links.push(
      `<a href="${esc(blog.social_link)}" target="_blank" rel="noopener" aria-label="Open social post for ${title} (opens in a new tab)">View Social Post</a>`
    );
  }

  const date = formatBlogDate(blog.created_at);

  return `
    <article class="blog-card reveal-item">
      ${imageMarkup}
      <div class="blog-card-body">
        ${date ? `<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${date}</p>` : ''}
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
      ${links.length ? `<div class="blog-card-footer">${links.join('')}</div>` : ''}
    </article>
  `;
}

function renderBlogs(blogs, query = '') {
  const container = document.getElementById('blog-container');
  if (!container) return;

  container.setAttribute('aria-busy', 'false');

  if (!blogs.length) {
    const message = query
      ? `No posts matched "${esc(query)}". Try a different search.`
      : 'No posts yet. Check back soon!';
    container.innerHTML = `<p class="blog-empty">${message}</p>`;
    announceBlogResults(0, query);
    return;
  }

  container.innerHTML = `<div class="blog-grid">${blogs.map(blogCard).join('')}</div>`;
  announceBlogResults(blogs.length, query);
}

async function loadBlogs() {
  const container = document.getElementById('blog-container');
  if (!container) return;

  if (window.location.protocol === 'file:') {
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = '<p class="blog-empty">Blog posts are visible when this page is opened through the server.</p>';
    announceBlogResults(0, '');
    return;
  }

  const isHomepage = window.location.pathname.endsWith('/index.html') || window.location.pathname === '/' || window.location.pathname === '';
  const searchInput = document.getElementById('blog-search');

  container.setAttribute('aria-busy', 'true');

  try {
    const res = await fetch(getApiUrl('/api/blogs'));
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const data = await res.json();
    allBlogs = Array.isArray(data) ? data.slice() : [];
    allBlogs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const query = searchInput ? searchInput.value.trim() : '';
    const visibleBlogs = searchInput
      ? filterBlogList(query)
      : (isHomepage ? allBlogs.slice(0, 3) : allBlogs);

    renderBlogs(visibleBlogs, query);
    setupScrollAnimations();
  } catch (err) {
    console.error('Failed to load blogs:', err);
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = '<p class="blog-empty">Could not load posts right now. Please try again later.</p>';
    announceBlogResults(0, '');
  }
}

function filterBlogList(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return allBlogs;

  return allBlogs.filter(blog => {
    const title = String(blog.title || '').toLowerCase();
    const description = String(blog.description || '').toLowerCase();
    return title.includes(normalized) || description.includes(normalized);
  });
}

function setupBlogSearch() {
  const input = document.getElementById('blog-search');
  if (!input) return;

  input.addEventListener('input', event => {
    const query = event.target.value.trim();
    renderBlogs(filterBlogList(query), query);
  });
}

function setupScrollAnimations() {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selectors = [
    '.hero-inner',
    '.stat-card',
    'section',
    '.focus-card',
    '.why-card',
    '.blog-card',
    '.pillar-card',
    '.quote-block',
    '.project-item',
    '.value-card',
    '.contact-item',
    '.form-group',
    '.footer-inner',
    '.footer-bottom'
  ];

  const elements = document.querySelectorAll(selectors.join(', '));
  if (!elements.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -10% 0px'
  });

  elements.forEach(el => {
    if (!el.classList.contains('reveal-item')) {
      el.classList.add('reveal-item');
    }
    observer.observe(el);
  });
}

function setupHeroMotion() {
  const hero = document.querySelector('.hero');
  if (!hero || !window.matchMedia) return;
  if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
    hero.style.setProperty('--hero-offset-x', `${offsetX}px`);
    hero.style.setProperty('--hero-offset-y', `${offsetY}px`);
  });

  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--hero-offset-x', '0px');
    hero.style.setProperty('--hero-offset-y', '0px');
  });
}

function setupMobileNav() {
  const button = document.querySelector('.nav-hamburger');
  const navLinks = document.getElementById('navLinks');
  if (!button || !navLinks) return;

  const setMenuState = isOpen => {
    navLinks.classList.toggle('open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  };

  setMenuState(false);

  button.addEventListener('click', () => {
    setMenuState(!navLinks.classList.contains('open'));
  });

  document.addEventListener('click', event => {
    if (!navLinks.contains(event.target) && !button.contains(event.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      setMenuState(false);
      button.focus();
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenuState(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      setMenuState(false);
    }
  });
}

function setupLogoFallback() {
  const logoImages = document.querySelectorAll('.nav-logo-mark');
  if (!logoImages.length) return;

  logoImages.forEach(img => {
    const wrapper = img.closest('.nav-logo-mark-wrap');
    if (!wrapper) return;

    const showFallback = () => wrapper.classList.add('logo-fallback');
    const hideFallback = () => wrapper.classList.remove('logo-fallback');

    img.addEventListener('error', showFallback);
    img.addEventListener('load', hideFallback);

    if (img.complete && img.naturalWidth === 0) {
      showFallback();
    }
  });
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const submitButton = document.getElementById('submitBtn');
  const status = document.getElementById('form-status');
  if (!form || !submitButton || !status) return;

  const fields = Array.from(form.querySelectorAll('input, select, textarea'));

  fields.forEach(field => {
    field.addEventListener('input', () => field.removeAttribute('aria-invalid'));
    field.addEventListener('change', () => field.removeAttribute('aria-invalid'));
    field.addEventListener('invalid', () => field.setAttribute('aria-invalid', 'true'));
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    status.hidden = true;
    status.className = 'form-status';
    status.textContent = '';

    if (!form.reportValidity()) {
      const firstInvalidField = fields.find(field => !field.checkValidity());
      if (firstInvalidField) {
        firstInvalidField.setAttribute('aria-invalid', 'true');
      }
      status.hidden = false;
      status.classList.add('error');
      status.textContent = 'Please review the highlighted fields and try again.';
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending...';

    await new Promise(resolve => setTimeout(resolve, 1000));

    form.reset();
    fields.forEach(field => field.removeAttribute('aria-invalid'));

    status.hidden = false;
    status.classList.add('success');
    status.textContent = 'Thank you. We will get back to you within 2 working days.';

    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.textContent = 'Send Message';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupLogoFallback();
  setupBlogSearch();
  loadBlogs();
  setupScrollAnimations();
  setupHeroMotion();
  setupMobileNav();
  setupContactForm();
});

// ── High Contrast Mode Toggle — WCAG 1.4.3 / RPwD Act 2016 ──
function setupContrastToggle() {
  const btn = document.getElementById('contrastToggle');
  if (!btn) return;
  const stored = localStorage.getItem('yp-high-contrast') === 'true';
  if (stored) {
    document.body.classList.add('high-contrast');
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = '◑ Standard Mode';
  }
  btn.addEventListener('click', () => {
    const isHC = document.body.classList.toggle('high-contrast');
    btn.setAttribute('aria-pressed', String(isHC));
    btn.textContent = isHC ? '◑ Standard Mode' : '◑ High Contrast';
    try { localStorage.setItem('yp-high-contrast', String(isHC)); } catch(e) {}
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupContrastToggle();
});
