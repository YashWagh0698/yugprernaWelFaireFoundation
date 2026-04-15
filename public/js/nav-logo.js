/**
 * nav-logo.js
 * Replaces the fallback "Y" mark in every nav with the real foundation logo.
 * Uses the Google Drive public URL directly — no API call required.
 */
(function injectLogo() {
  const LOGO_URL = 'https://drive.google.com/uc?id=1krpIJwi0ZUlLmnE0Z2pRff8NSsnZa-Vb';

  document.querySelectorAll('.nav-logo').forEach(navLogo => {
    const mark = navLogo.querySelector('.nav-logo-mark');
    if (!mark) return;

    const img = document.createElement('img');
    img.src = LOGO_URL;
    img.alt = 'YugPrerna Welfare Foundation Logo';
    img.className = 'nav-logo-img';
    img.loading = 'eager';

    // If Drive image fails to load, show the fallback "Y" mark
    img.onerror = function () {
      img.remove();
      mark.style.display = 'flex';
    };

    // Hide the "Y" fallback and insert the real logo before it
    mark.style.display = 'none';
    mark.parentNode.insertBefore(img, mark);
  });
})();
