// Small utilities used across pages: service worker registration and year updater
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('Service Worker registered:', reg);
      // Listen for updatefound to notify user or auto-refresh
      reg.addEventListener('updatefound', () => console.log('Service worker update found'));
    })
    .catch(err => console.log('Service Worker registration failed:', err));
}

// Update footer year
try {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
} catch (e) {}

// Render a small user navigation if a user is signed in (places a link to the dashboard)
function renderUserNav(placeholderId = 'siteNav') {
  try {
    const cur = JSON.parse(localStorage.getItem('fixbuddy_current_user') || 'null');
    const container = document.getElementById(placeholderId);
    if (!container) return;
    container.innerHTML = '';
    if (cur && cur.email) {
      const a = document.createElement('a');
      a.href = '../UserDashboard/UserDashboard.html';
      a.textContent = 'Dashboard';
      a.className = 'btn btn-link';
      container.appendChild(a);
      const span = document.createElement('span');
      span.textContent = ` ${cur.name || cur.email}`;
      span.className = 'user-name';
      container.appendChild(span);
    }
  } catch (e) {
    // noop
  }
}

// Auto-render user nav if placeholder exists
try { renderUserNav(); } catch (e) {}
