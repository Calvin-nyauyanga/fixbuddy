/**
 * FixBuddy Theme Manager v2
 * Advanced dark mode management with persistence
 * Supports localStorage and system preference detection
 */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'fixbuddy-theme';
    this.THEME_ATTRIBUTE = 'data-theme';
    this.THEMES = {
      LIGHT: 'light',
      DARK: 'dark'
    };
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.detectInitialTheme();
    this.setupEventListeners();
    this.initializeTheme();
  }

  /**
   * Detect initial theme from various sources
   */
  detectInitialTheme() {
    // 1. Check localStorage
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme && Object.values(this.THEMES).includes(savedTheme)) {
      this.currentTheme = savedTheme;
      return;
    }

    // 2. Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = this.THEMES.DARK;
      return;
    }

    // 3. Default to light
    this.currentTheme = this.THEMES.LIGHT;
  }

  /**
   * Initialize theme on page load
   */
  initializeTheme() {
    this.applyTheme(this.currentTheme);
    this.updateThemeToggle();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme toggle buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('theme-toggle')) {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // System theme change listener
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.currentTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.applyTheme(this.currentTheme);
      });
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    // Update root attribute
    document.documentElement.setAttribute(this.THEME_ATTRIBUTE, theme);
    
    // Update localStorage
    localStorage.setItem(this.STORAGE_KEY, theme);
    
    // Update current theme
    this.currentTheme = theme;
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    
    // Update meta theme-color
    this.updateMetaThemeColor(theme);
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    const newTheme = this.currentTheme === this.THEMES.LIGHT 
      ? this.THEMES.DARK 
      : this.THEMES.LIGHT;
    
    this.applyTheme(newTheme);
    this.updateThemeToggle();
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    if (Object.values(this.THEMES).includes(theme)) {
      this.applyTheme(theme);
      this.updateThemeToggle();
    }
  }

  /**
   * Update all theme toggle button icons
   */
  updateThemeToggle() {
    const toggleButtons = document.querySelectorAll('.theme-toggle');
    toggleButtons.forEach(button => {
      const isDark = this.currentTheme === this.THEMES.DARK;
      button.textContent = isDark ? '☀️' : '🌙';
      button.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    });
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    const color = theme === this.THEMES.DARK ? '#0f1117' : '#ffffff';
    metaThemeColor.setAttribute('content', color);
  }

  /**
   * Sync theme after login
   */
  async syncAfterLogin() {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.initializeTheme();
  }

  /**
   * Export theme data
   */
  exportThemeData() {
    return {
      currentTheme: this.currentTheme,
      savedTheme: localStorage.getItem(this.STORAGE_KEY)
    };
  }

  /**
   * Listen for settings changes from other pages
   */
  listenForSettingsUpdates() {
    try {
      if (window.BroadcastChannel) {
        const settingsChannel = new BroadcastChannel('fixbuddy-settings');
        settingsChannel.addEventListener('message', (event) => {
          if (event.data.type === 'SETTINGS_UPDATED' && event.data.settingType === 'appearance') {
            // Update dark mode if it was changed in settings
            if (event.data.data.darkMode !== undefined) {
              const newTheme = event.data.data.darkMode ? this.THEMES.DARK : this.THEMES.LIGHT;
              this.applyTheme(newTheme);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Could not setup settings listener:', err);
    }
  }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.themeManager.listenForSettingsUpdates();
  });
} else {
  window.themeManager = new ThemeManager();
  window.themeManager.listenForSettingsUpdates();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
