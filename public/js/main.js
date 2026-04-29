// ══════════════════════════════════════════════════════════
//  YugPrerna Welfare Foundation — main.js  v5
//  WCAG 2.1 AA · Section 508 · RPwD Act 2016
// ══════════════════════════════════════════════════════════

let allBlogs = [];

function getApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (window.location.protocol === 'file:') return `http://localhost:5000${p}`;
  return p;
}
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatBlogDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function announceBlogResults(count,query='') {
  const s = document.getElementById('blog-results-status');
  if (!s) return;
  s.textContent = query ? `${count} post${count===1?'':'s'} found for "${query}".` : `${count} post${count===1?'':'s'} available.`;
}
function blogCard(blog) {
  const title = esc(blog.title||'Untitled post');
  const desc  = esc(blog.description||'No description available.');
  const img   = blog.image
    ? `<img src="${esc(blog.image)}" alt="Featured image for ${title}" class="blog-card-img" loading="lazy">`
    : `<div class="blog-card-img-placeholder" aria-hidden="true">📰</div>`;
  const links = [];
  if (blog.video)       links.push(`<a href="${esc(blog.video)}" target="_blank" rel="noopener" aria-label="Watch video for ${title} (opens in new tab)">Watch Video</a>`);
  if (blog.social_link) links.push(`<a href="${esc(blog.social_link)}" target="_blank" rel="noopener" aria-label="Social post for ${title} (opens in new tab)">View Post</a>`);
  const date = formatBlogDate(blog.created_at);
  return `<article class="blog-card reveal-item">
    ${img}
    <div class="blog-card-body">
      ${date?`<p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">${date}</p>`:''}
      <h3>${title}</h3><p>${desc}</p>
    </div>
    ${links.length?`<div class="blog-card-footer">${links.join('')}</div>`:''}
  </article>`;
}
function renderBlogs(blogs,query='') {
  const c = document.getElementById('blog-container');
  if (!c) return;
  c.setAttribute('aria-busy','false');
  if (!blogs.length) {
    const msg = query ? `No posts matched "${esc(query)}". Try a different search.` : 'No posts yet. Check back soon!';
    c.innerHTML = `<p class="blog-empty">${msg}</p>`;
    announceBlogResults(0,query);
    return;
  }
  c.innerHTML = `<div class="blog-grid">${blogs.map(blogCard).join('')}</div>`;
  announceBlogResults(blogs.length,query);
  setupScrollAnimations();
}
async function loadBlogs() {
  const c = document.getElementById('blog-container');
  if (!c) return;
  if (window.location.protocol==='file:') {
    c.setAttribute('aria-busy','false');
    c.innerHTML='<p class="blog-empty">Blog posts are visible when served through the web server.</p>';
    return;
  }
  const isHome = window.location.pathname.endsWith('/index.html')||window.location.pathname==='/'||window.location.pathname==='';
  const searchInput = document.getElementById('blog-search');
  c.setAttribute('aria-busy','true');
  try {
    const res = await fetch(getApiUrl('/api/blogs'));
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    allBlogs = Array.isArray(data) ? data : (data.blogs||[]);
    if (isHome) {
      renderBlogs(allBlogs.slice(0,3));
    } else {
      renderBlogs(allBlogs);
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim().toLowerCase();
          renderBlogs(q ? allBlogs.filter(b=>(b.title||'').toLowerCase().includes(q)||(b.description||'').toLowerCase().includes(q)) : allBlogs, q);
        });
      }
    }
  } catch(e) {
    c.setAttribute('aria-busy','false');
    c.innerHTML='<p class="blog-empty">Could not load posts. Please try again later.</p>';
  }
}
function setupBlogSearch() {}

function setupScrollAnimations() {
  const items = document.querySelectorAll('.section > .container > *, .hero-inner > *, .programs-grid > *, .focus-grid > *, .why-grid > *, .stories-grid > *, .blog-grid > *, .impact-dashboard > *');
  if (!('IntersectionObserver' in window)) { items.forEach(el=>el.classList.add('is-visible')); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  },{threshold:0.1,rootMargin:'0px 0px -8% 0px'});
  items.forEach(el=>{ el.classList.add('reveal-item'); obs.observe(el); });
}

// ── Mobile nav ──────────────────────────────────────────────────
function setupMobileNav() {
  const btn = document.querySelector('.nav-hamburger');
  const nav = document.getElementById('navLinks');
  if (!btn||!nav) return;
  const set = open => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  };
  set(false);
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  document.addEventListener('click', e => { if (!nav.contains(e.target)&&!btn.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key==='Escape'&&nav.classList.contains('open')){set(false);btn.focus();} });
  nav.querySelectorAll('a:not(.nav-dropdown-menu a)').forEach(a => a.addEventListener('click', () => set(false)));
  window.addEventListener('resize', () => { if (window.innerWidth>900) set(false); });
}

// ── Programs dropdown — FIXED: hover gap + keyboard trap ───────
function setupDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    const trigger = dd.querySelector(':scope > a');
    const menu    = dd.querySelector('.nav-dropdown-menu');
    if (!trigger || !menu) return;

    // Give trigger a button role for keyboard users
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    let hoverTimer = null;

    // ── Mouse: use a small delay so cursor can move into menu ──
    dd.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      openDd(dd, trigger, menu);
    });
    dd.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => closeDd(dd, trigger, menu), 100);
    });
    menu.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
    menu.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => closeDd(dd, trigger, menu), 100);
    });

    // ── Keyboard: Enter/Space toggles; Escape closes; Tab leaves ──
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = dd.classList.contains('dd-open');
        if (isOpen) closeDd(dd, trigger, menu);
        else { openDd(dd, trigger, menu); menu.querySelector('a')?.focus(); }
      }
      if (e.key === 'Escape') { closeDd(dd, trigger, menu); trigger.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); openDd(dd, trigger, menu); menu.querySelector('a')?.focus(); }
    });

    // Arrow keys inside menu
    menu.querySelectorAll('a').forEach((item, idx, all) => {
      item.addEventListener('keydown', e => {
        if (e.key === 'Escape')    { closeDd(dd, trigger, menu); trigger.focus(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); all[idx+1]?.focus(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); idx===0 ? trigger.focus() : all[idx-1]?.focus(); }
        if (e.key === 'Tab' && !e.shiftKey && idx === all.length - 1) { closeDd(dd, trigger, menu); }
        if (e.key === 'Tab' && e.shiftKey  && idx === 0)               { closeDd(dd, trigger, menu); trigger.focus(); e.preventDefault(); }
      });
    });

    // Close if focus leaves the dropdown entirely
    dd.addEventListener('focusout', e => {
      requestAnimationFrame(() => { if (!dd.contains(document.activeElement)) closeDd(dd, trigger, menu); });
    });

    // Click on trigger link
    trigger.addEventListener('click', e => {
      // On desktop just let hover handle it; on mobile toggle
      if (window.innerWidth <= 900) {
        e.preventDefault();
        const isOpen = dd.classList.contains('dd-open');
        if (isOpen) closeDd(dd, trigger, menu);
        else openDd(dd, trigger, menu);
      }
    });
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown').forEach(dd => {
        const trigger = dd.querySelector(':scope > a');
        const menu    = dd.querySelector('.nav-dropdown-menu');
        closeDd(dd, trigger, menu);
      });
    }
  });
}

function openDd(dd, trigger, menu) {
  dd.classList.add('dd-open');
  menu.classList.add('dd-visible');
  trigger.setAttribute('aria-expanded', 'true');
}
function closeDd(dd, trigger, menu) {
  dd.classList.remove('dd-open');
  menu.classList.remove('dd-visible');
  trigger.setAttribute('aria-expanded', 'false');
}

function setupLogoFallback() {
  document.querySelectorAll('.nav-logo-mark').forEach(img => {
    const wrap = img.closest('.nav-logo-mark-wrap');
    if (!wrap) return;
    img.addEventListener('error', () => wrap.classList.add('logo-fallback'));
    img.addEventListener('load',  () => wrap.classList.remove('logo-fallback'));
    if (img.complete && img.naturalWidth === 0) wrap.classList.add('logo-fallback');
  });
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('form-status');
  if (!form||!submitBtn||!status) return;
  const fields = Array.from(form.querySelectorAll('input,select,textarea'));
  fields.forEach(f => {
    f.addEventListener('input',   () => f.removeAttribute('aria-invalid'));
    f.addEventListener('invalid', () => f.setAttribute('aria-invalid','true'));
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.hidden = true; status.className = 'form-status'; status.textContent = '';
    if (!form.reportValidity()) {
      const bad = fields.find(f => !f.checkValidity());
      if (bad) bad.setAttribute('aria-invalid','true');
      status.hidden = false; status.classList.add('error');
      status.textContent = 'Please review the highlighted fields and try again.';
      return;
    }
    submitBtn.disabled = true; submitBtn.setAttribute('aria-busy','true'); submitBtn.textContent = 'Sending…';
    await new Promise(r => setTimeout(r, 1000));
    form.reset(); fields.forEach(f => f.removeAttribute('aria-invalid'));
    status.hidden = false; status.classList.add('success');
    status.textContent = 'Thank you. We will get back to you within 2 working days.';
    submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); submitBtn.textContent = 'Send Message';
  });
}

// ── Accessibility Preferences ───────────────────────────────────
function getPrefs()  { try { return JSON.parse(localStorage.getItem('yp-a11y')||'{}'); } catch { return {}; } }
function savePrefs(p){ try { localStorage.setItem('yp-a11y', JSON.stringify(p)); } catch {} }
function applyPrefs(p) {
  document.body.classList.toggle('high-contrast', !!p.hc);
  document.body.classList.toggle('large-text',     !!p.lt);
  document.body.classList.toggle('dyslexia-font',  !!p.dx);
  document.body.classList.toggle('reading-mode',   !!p.rm);
}
function syncA11yBtns() {
  const p = getPrefs();
  const map = {btnHC:'hc', btnLT:'lt', btnDX:'dx', btnRM:'rm'};
  Object.entries(map).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (btn) btn.setAttribute('aria-pressed', String(!!p[key]));
  });
}
function setupA11yToolbar() {
  applyPrefs(getPrefs());
  syncA11yBtns();
  [['btnHC','hc'],['btnLT','lt'],['btnDX','dx'],['btnRM','rm']].forEach(([id,key]) => {
    document.getElementById(id)?.addEventListener('click', () => {
      const p = getPrefs(); p[key] = !p[key]; savePrefs(p); applyPrefs(p); syncA11yBtns();
    });
  });
}

// ── Accessibility Panel Toggle ──────────────────────────────────
function setupA11yPanel() {
  const panel     = document.getElementById('a11yPanel');
  const toggleBtn = document.getElementById('a11yToggleBtn');
  const mobileFab = document.getElementById('a11yMobileFab');
  if (!panel) return;

  const open  = () => { panel.classList.add('open');    toggleBtn?.setAttribute('aria-expanded','true');  mobileFab?.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.remove('open'); toggleBtn?.setAttribute('aria-expanded','false'); mobileFab?.setAttribute('aria-expanded','false'); };
  const toggle = () => panel.classList.contains('open') ? close() : open();

  toggleBtn?.addEventListener('click', toggle);
  mobileFab?.addEventListener('click', toggle);

  document.addEventListener('click', e => {
    if (!panel.classList.contains('open')) return;
    if (!panel.contains(e.target) && !toggleBtn?.contains(e.target) && !mobileFab?.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) { close(); (toggleBtn||mobileFab)?.focus(); }
  });

  const langSel = document.getElementById('langSelect');
  langSel?.addEventListener('change', () => document.documentElement.setAttribute('lang', langSel.value));
}

// ── Impact bar animation ────────────────────────────────────────
function animateImpactBars() {
  const bars = document.querySelectorAll('.impact-bar');
  if (!bars.length || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      const target = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.width = target; });
      obs.unobserve(bar);
    });
  },{threshold:0.5});
  bars.forEach(b => obs.observe(b));
}

// ── Course tab filter ───────────────────────────────────────────
function setupCourseFilter() {
  const tabs  = document.querySelectorAll('.course-tab-btn');
  const cards = document.querySelectorAll('.course-card');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('active'); tab.setAttribute('aria-selected','true');
      const filter = tab.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

// ── Enrolment form ──────────────────────────────────────────────
function setupEnrolmentForm() {
  const form = document.getElementById('enrolForm');
  if (!form) return;
  const pwdField = document.getElementById('disabilityType');
  const pwdQ     = document.getElementById('isPwd');
  const pwdWrap  = document.getElementById('disabilityTypeWrap');
  if (pwdQ && pwdWrap) {
    pwdQ.addEventListener('change', () => {
      const show = pwdQ.value === 'yes';
      pwdWrap.style.display = show ? '' : 'none';
      if (pwdField) pwdField.required = show;
    });
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const status = document.getElementById('enrol-status');
    if (status) {
      status.hidden = false;
      status.textContent = 'Thank you! Your enquiry has been submitted. Our team will contact you within 2 working days.';
      status.classList.add('success');
      form.reset();
      if (pwdWrap) pwdWrap.style.display = 'none';
    }
  });
}

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupLogoFallback();
  setupBlogSearch();
  loadBlogs();
  setupScrollAnimations();
  setupMobileNav();
  setupDropdowns();
  setupContactForm();
  setupA11yToolbar();
  setupA11yPanel();
  animateImpactBars();
  setupCourseFilter();
  setupEnrolmentForm();
});
