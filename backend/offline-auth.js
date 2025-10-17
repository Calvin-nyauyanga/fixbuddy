// Shared offline auth utilities for FixBuddy
// Exposes: sha256Hex, getLocalUsers, saveLocalUsers, initSignup, initLogin

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem('fixbuddy_users') || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalUsers(users) {
  localStorage.setItem('fixbuddy_users', JSON.stringify(users));
}

function initSignup(formSelector = '.login-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('signupMessage');
    if (msg) msg.textContent = '';

    if (!email || !password || !name) {
      if (msg) msg.textContent = 'Please fill all required fields.';
      return;
    }

    const passwordHash = await sha256Hex(password);

    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = res.ok ? await res.json() : null;
        if (res.ok && data && data.message === 'User registered!') {
          const users = getLocalUsers();
          users[email] = { name, email, passwordHash, createdAt: Date.now() };
          saveLocalUsers(users);
          window.location.href = '../UserDashboard/UserDashboard.html';
          return;
        } else if (data && data.message === 'An account with this email already exists.') {
          if (msg) msg.textContent = 'This account is already registered. Please sign in or use a different email.';
          return;
        } else {
          if (msg) msg.textContent = data && data.message ? data.message : 'Registration failed.';
          return;
        }
      } catch (err) {
        // fallthrough to local
        console.warn('Server registration failed, falling back to local storage', err);
      }
    }

    const users = getLocalUsers();
    if (users[email]) {
      if (msg) msg.textContent = 'This account is already registered locally. Please sign in.';
      return;
    }
    users[email] = { name, email, passwordHash, createdAt: Date.now() };
    saveLocalUsers(users);
    localStorage.setItem('fixbuddy_current_user', JSON.stringify({ email, name }));
    if (msg) msg.textContent = 'Registered locally. Redirecting...';
    setTimeout(() => window.location.href = '../UserDashboard/UserDashboard.html', 600);
  });
}

function initLogin(formSelector = '.login-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const email = (emailEl.value || '').trim().toLowerCase();
    const password = passwordEl.value;
    const msg = document.getElementById('loginMessage');
    if (msg) msg.textContent = '';

    if (!email || !password) {
      if (msg) msg.textContent = 'Please enter email and password.';
      return;
    }

    if (navigator.onLine) {
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data && data.success) {
          const users = getLocalUsers();
          users[email] = users[email] || { email, name: data.user?.name || '', passwordHash: await sha256Hex(password), createdAt: Date.now() };
          saveLocalUsers(users);
          localStorage.setItem('fixbuddy_current_user', JSON.stringify({ email, name: data.user?.name || '' }));
          window.location.href = '../UserDashboard/UserDashboard.html';
          return;
        } else {
          console.warn('Server login failed, trying local fallback', data && data.message);
        }
      } catch (err) {
        console.warn('Server login error, falling back to local auth', err);
      }
    }

    try {
      const users = getLocalUsers();
      const user = users[email];
      if (!user) {
        if (msg) msg.textContent = 'No local account found for this email. Please sign up while online.';
        return;
      }
      const localHash = user.passwordHash;
      const attemptHash = await sha256Hex(password);
      if (localHash === attemptHash) {
        localStorage.setItem('fixbuddy_current_user', JSON.stringify({ email: user.email, name: user.name || '' }));
        window.location.href = '../UserDashboard/UserDashboard.html';
        return;
      } else {
        if (msg) msg.textContent = 'Email or password is incorrect.';
        return;
      }
    } catch (err) {
      console.error(err);
      if (msg) msg.textContent = 'Error logging in. Please try again.';
    }
  });
}

// Auto-init when included in pages that expect it. Wait for DOMContentLoaded
function autoInit() {
  try {
    if (document.querySelector('.signup-form')) {
      initSignup('.signup-form');
    }
    if (document.querySelector('.login-form')) {
      initLogin('.login-form');
    }
  } catch (e) {
    // ignore
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  // DOM already ready
  autoInit();
}
