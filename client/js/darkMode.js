const DARK_MODE_KEY = 'fixbuddyDarkModePreference';
const DARKMODE_API_BASE = 'http://localhost:5000/api';
const DARK_MODE_CLASS = 'dark-mode';
const DARK_MODE_BUTTON_ID = 'darkModeToggle';

function getStoredPreference() {
  return localStorage.getItem(DARK_MODE_KEY);
}

function saveLocalPreference(theme) {
  localStorage.setItem(DARK_MODE_KEY, theme);
}

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle(DARK_MODE_CLASS, isDark);
  updateToggleButton(isDark);
}

function updateToggleButton(isDark) {
  const button = document.getElementById(DARK_MODE_BUTTON_ID);
  if (!button) return;

  const icon = button.querySelector('i');
  if (icon) {
    icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  button.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

async function fetchRemotePreference() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${DARKMODE_API_BASE}/darkmode/preference`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return json.darkMode ? 'dark' : 'light';
  } catch (error) {
    return null;
  }
}

async function saveRemotePreference(theme) {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${DARKMODE_API_BASE}/darkmode/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ enabled: theme === 'dark' })
    });
  } catch (error) {
    console.warn('Dark mode preference not saved remotely:', error.message);
  }
}

async function setTheme(theme) {
  applyTheme(theme);
  saveLocalPreference(theme);
  await saveRemotePreference(theme);
}

function createToggleButton() {
  if (document.getElementById(DARK_MODE_BUTTON_ID)) return;

  const targetContainer = document.querySelector('.admin-topbar-right') || document.querySelector('.dashboard-header');
  if (!targetContainer) return;

  const button = document.createElement('button');
  button.id = DARK_MODE_BUTTON_ID;
  button.className = 'dark-mode-btn';
  button.type = 'button';
  button.innerHTML = '<i class="fa-solid fa-moon"></i>';
  button.addEventListener('click', async () => {
    const isDark = document.body.classList.contains(DARK_MODE_CLASS);
    await setTheme(isDark ? 'light' : 'dark');
  });

  targetContainer.appendChild(button);
}

function attachSettingsCheckbox(theme) {
  const checkbox = document.getElementById('darkMode');
  if (!checkbox) return;

  checkbox.checked = theme === 'dark';
  checkbox.addEventListener('change', async () => {
    await setTheme(checkbox.checked ? 'dark' : 'light');
  });
}

async function initDarkMode() {
  createToggleButton();

  const stored = getStoredPreference();
  const remote = await fetchRemotePreference();
  const theme = remote || stored || getSystemPreference();

  applyTheme(theme);
  attachSettingsCheckbox(theme);

  if (!stored) {
    saveLocalPreference(theme);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}
