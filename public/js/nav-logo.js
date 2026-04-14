/**
 * nav-logo.js
 * Fetches the site logo URL from /api/config (which reads website_logo from .env)
 * and replaces the fallback "Y" mark in the navbar with the real logo image.
 * Included on every public page via <script src="js/nav-logo.js"></script>
 */
(async function injectLogo() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const { logoUrl } = await res.json();
    if (!logoUrl) return;

    // Find every .nav-logo-mark on the page (there's usually just one)
    document.querySelectorAll('.nav-logo-mark').forEach(mark => {
      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'YugPrerna Welfare Foundation Logo';
      img.className = 'nav-logo-img';
      img.loading = 'eager';

      // If the image fails to load, keep showing the fallback "Y" mark
      img.onerror = () => { img.remove(); mark.style.display = 'flex'; };

      // Hide the fallback mark and insert the real logo before it
      mark.style.display = 'none';
      mark.parentNode.insertBefore(img, mark);
    });
  } catch (e) {
    // Silently fail — fallback "Y" mark stays visible
  }
})();
