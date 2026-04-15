async function loadBlogs() {
  const container = document.getElementById('blog-container');
  if (!container) return;

  const isHomepage = document.querySelector('title')?.textContent?.includes('YugPrerna Welfare Foundation') &&
                     !document.querySelector('title')?.textContent?.includes('Blog');

  // If opened via file:// (e.g., WhatsApp forward), API fetch will fail due to CORS.
  if (window.location && window.location.protocol === 'file:') {
    container.innerHTML = '<p class="blog-empty">Blog data loads only when the site is opened via http:// (local server or hosting).</p>';
    return;
  }

  try {
    const res = await fetch('/api/blogs');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    let data = await res.json();

    data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (isHomepage) data = data.slice(0, 3);

    container.innerHTML = '';
    if (data.length === 0) {
      container.innerHTML = '<p class="blog-empty">No posts yet. Check back soon!</p>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'blog-grid';

    data.forEach(blog => {
      const article = document.createElement('article');
      article.className = 'blog-card reveal-item';

      const img = blog.image
        ? `<img src="${esc(blog.image)}" alt="${esc(blog.title)}" class="blog-card-img" loading="lazy">`
        : `<div class="blog-card-img-placeholder" aria-hidden="true">📰</div>`;

      const date = blog.created_at
        ? new Date(blog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

      const links = [];
      if (blog.video) links.push(`<a href="${esc(blog.video)}" target="_blank" rel="noopener">▶ Video</a>`);
      if (blog.social_link) links.push(`<a href="${esc(blog.social_link)}" target="_blank" rel="noopener">↗ Social</a>`);

      article.innerHTML = `
        ${img}
        <div class="blog-card-body">
          ${date ? `<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${date}</p>` : ''}
          <h3>${esc(blog.title)}</h3>
          <p>${esc(blog.description)}</p>
        </div>
        ${links.length ? `<div class="blog-card-footer">${links.join('')}</div>` : ''}
      `;
      grid.appendChild(article);
    });

    container.appendChild(grid);
  } catch (err) {
    console.error('Failed to load blogs:', err);
    if (container) {
      container.innerHTML = '<p class="blog-empty">Could not load posts right now.</p>';
    }
  }
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

<<<<<<< HEAD
loadBlogs();




<<<<<<< HEAD
=======
function setupScrollAnimations() {
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

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('open');
    button.setAttribute('aria-expanded', navLinks.classList.contains('open') ? 'true' : 'false');
  });

  document.addEventListener('click', event => {
    if (!navLinks.contains(event.target) && !button.contains(event.target)) {
      navLinks.classList.remove('open');
    }
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      navLinks.classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadBlogs();
  setupScrollAnimations();
  setupHeroMotion();
  setupMobileNav();
});
>>>>>>> a73b645 (improved UI)
=======
>>>>>>> 2aa42300a67da169e869904c593e46fa93b4b5c7
