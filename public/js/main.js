async function loadBlogs() {
  const container = document.getElementById('blog-container');
  if (!container) return;

  // On index.html show only 3 latest; blogs.html shows all (has its own script)
  const isHomepage = document.querySelector('title')?.textContent?.includes('YugPrerna Welfare Foundation') &&
                     !document.querySelector('title')?.textContent?.includes('Blog');

  try {
    const res = await fetch('/api/blogs');
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    let data = await res.json();

    // Sort newest first
    data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Homepage: show only 3
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
      article.className = 'blog-card';

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

loadBlogs();
