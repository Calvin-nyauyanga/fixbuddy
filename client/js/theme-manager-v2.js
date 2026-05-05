/**
 * Theme Manager v2.0
 * Enhanced dark mode handler with CSS variables and smooth transitions
 * WCAG AAA compliant, fully accessible dark mode system
 */

class ThemeManagerV2 {
  constructor() {
    this.isDarkMode = false;
    this.toggleButton = null;
    this.isAuthenticated = false;
    this.systemPreferences = null;
    this.transitioningTheme = false;
    
    // Configuration
    this.config = {
      storageKey: 'theme-preference',
      dataAttributeName: 'data-theme',
      prefersDarkQuery: '(prefers-color-scheme: dark)',
      transitionDuration: 300 // ms
    };
    
    this.init();
  }

  /**
   * Initialize theme manager
   */
  async init() {
    console.log('🎨 Initializing Theme Manager v2.0...');
    
    // Check system preferences
    this.checkSystemPreferences();
    
    // Check authentication
    this.checkAuthentication();
    
    // Load theme preference
    await this.loadThemePreference();
    
    // Apply theme to DOM
    this.applyTheme();
    
    // Setup toggle button
    this.setupToggleButton();
    
    // Listen for system preference changes
    this.watchSystemPreferences();
    
    console.log('✅ Theme Manager initialized successfully');
  }

  /**
   * Check system color scheme preferences
   */
  checkSystemPreferences() {
    const darkModeQuery = window.matchMedia(this.config.prefersDarkQuery);
    this.systemPreferences = darkModeQuery.matches;
    console.log(`🌙 System prefers dark mode: ${this.systemPreferences}`);
  }

  /**
   * Watch for system preference changes
   */
  watchSystemPreferences() {
    const darkModeQuery = window.matchMedia(this.config.prefersDarkQuery);
    darkModeQuery.addListener((e) => {
      this.systemPreferences = e.matches;
      
      // Only auto-switch if no user preference is saved
      const savedTheme = localStorage.getItem(this.config.storageKey);
      if (!savedTheme) {
        this.isDarkMode = e.matches;
        this.applyTheme();
      }
    });
  }

  /**
   * Check if user is authenticated
   */
  checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    this.isAuthenticated = !!(token && user);
    console.log(`🔐 User authenticated: ${this.isAuthenticated}`);
  }

  /**
   * Load theme preference from API or localStorage
   */
  async loadThemePreference() {
    try {
      // First check localStorage
      const savedTheme = localStorage.getItem(this.config.storageKey);
      
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === 'dark';
        console.log(`📦 Loaded theme from localStorage: ${this.isDarkMode ? 'dark' : 'light'}`);
        return;
      }

      // If authenticated, try to load from API
      if (this.isAuthenticated && typeof themeAPI !== 'undefined') {
        try {
          const result = await themeAPI.getDarkModePreference();
          
          if (result && result.success) {
            this.isDarkMode = result.data.darkmode;
            localStorage.setItem(this.config.storageKey, this.isDarkMode ? 'dark' : 'light');
            console.log(`📡 Loaded theme from API: ${this.isDarkMode ? 'dark' : 'light'}`);
            return;
          }
        } catch (apiError) {
          console.warn('⚠️  Could not load from API:', apiError.message);
        }
      }

      // Fall back to system preferences
      this.isDarkMode = this.systemPreferences || false;
      console.log(`🎯 Using system preference: ${this.isDarkMode ? 'dark' : 'light'}`);
      
    } catch (error) {
      console.error('❌ Error loading theme preference:', error);
      this.isDarkMode = false;
    }
  }

  /**
   * Apply theme to DOM with smooth transition
   */
  applyTheme() {
    if (this.transitioningTheme) return;
    
    this.transitioningTheme = true;
    const htmlElement = document.documentElement;
    const theme = this.isDarkMode ? 'dark' : 'light';
    
    // Set data attribute
    htmlElement.setAttribute(this.config.dataAttributeName, theme);
    
    // Update body classes
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
    
    // Update toggle button
    this.updateToggleButtonState();
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme, isDarkMode: this.isDarkMode }
    }));
    
    // Reset transition flag after duration
    setTimeout(() => {
      this.transitioningTheme = false;
    }, this.config.transitionDuration);
    
    console.log(`🎨 Theme applied: ${theme}`);
  }

  /**
   * Setup toggle button
   */
  setupToggleButton() {
    this.toggleButton = document.querySelector('.theme-toggle');
    
    if (!this.toggleButton) {
      console.warn('⚠️  Theme toggle button not found (.theme-toggle)');
      return;
    }
    
    this.toggleButton.addEventListener('click', () => this.toggle());
    this.toggleButton.setAttribute('role', 'button');
    this.toggleButton.setAttribute('aria-label', 'Toggle theme');
    this.toggleButton.setAttribute('tabindex', '0');
    
    // Support keyboard activation
    this.toggleButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    this.updateToggleButtonState();
  }

  /**
   * Update toggle button appearance
   */
  updateToggleButtonState() {
    if (!this.toggleButton) return;
    
    const theme = this.isDarkMode ? 'dark' : 'light';
    const icon = this.isDarkMode ? '☀️' : '🌙';
    const label = this.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    
    this.toggleButton.textContent = icon;
    this.toggleButton.title = label;
    this.toggleButton.setAttribute('aria-label', label);
    this.toggleButton.setAttribute('data-theme', theme);
  }

  /**
   * Toggle dark mode
   */
  async toggle() {
    if (this.transitioningTheme) return;
    
    try {
      this.toggleButton.disabled = true;
      
      // Check authentication again
      this.checkAuthentication();
      
      if (this.isAuthenticated && typeof themeAPI !== 'undefined') {
        try {
          const result = await themeAPI.toggleDarkMode();
          
          if (result && result.success) {
            this.isDarkMode = result.data.darkmode;
            localStorage.setItem(this.config.storageKey, this.isDarkMode ? 'dark' : 'light');
            this.applyTheme();
            this.showNotification(`Switched to ${this.isDarkMode ? 'dark' : 'light'} mode`);
            console.log(`✅ Theme toggled via API: ${this.isDarkMode ? 'dark' : 'light'}`);
            return;
          }
        } catch (apiError) {
          console.warn('⚠️  API toggle failed, using local fallback:', apiError.message);
        }
      }
      
      // Fallback: toggle locally
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem(this.config.storageKey, this.isDarkMode ? 'dark' : 'light');
      this.applyTheme();
      this.showNotification(`Switched to ${this.isDarkMode ? 'dark' : 'light'} mode`);
      console.log(`⚙️  Theme toggled locally: ${this.isDarkMode ? 'dark' : 'light'}`);
      
    } catch (error) {
      console.error('❌ Error toggling theme:', error);
      this.showNotification('Failed to change theme', 'error');
    } finally {
      if (this.toggleButton) {
        this.toggleButton.disabled = false;
      }
    }
  }

  /**
   * Set theme explicitly
   */
  async setTheme(theme) {
    const isDark = theme === 'dark';
    
    if (this.isDarkMode === isDark) return;
    
    this.isDarkMode = isDark;
    localStorage.setItem(this.config.storageKey, theme);
    this.applyTheme();
    
    // Try to sync with API if authenticated
    if (this.isAuthenticated && typeof themeAPI !== 'undefined') {
      try {
        await themeAPI.toggleDarkMode();
      } catch (error) {
        console.warn('⚠️  Could not sync theme with API:', error.message);
      }
    }
  }

  /**
   * Get current theme status
   */
  getTheme() {
    return this.isDarkMode ? 'dark' : 'light';
  }

  /**
   * Get theme preferences object
   */
  getPreferences() {
    return {
      isDarkMode: this.isDarkMode,
      theme: this.getTheme(),
      isAuthenticated: this.isAuthenticated,
      systemPreference: this.systemPreferences
    };
  }

  /**
   * Sync theme after login
   */
  async syncAfterLogin() {
    console.log('🔄 Syncing theme after login...');
    this.checkAuthentication();
    await this.loadThemePreference();
    this.applyTheme();
  }

  /**
   * Clear theme preference
   */
  clearPreference() {
    localStorage.removeItem(this.config.storageKey);
    this.isDarkMode = this.systemPreferences || false;
    this.applyTheme();
    console.log('🗑️  Theme preference cleared, using system preference');
  }

  /**
   * Show notification (simple toast)
   */
  showNotification(message, type = 'success') {
    // Create simple notification if not using a notification library
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} animate-slide-in-right`;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background-color: ${type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'};
      color: white;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('closing');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Enable/disable animations during theme transitions
   */
  disableTransitionsTemporarily() {
    document.body.style.pointerEvents = 'none';
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
    }, this.config.transitionDuration);
  }
}

// Create global instance with IIFE pattern for encapsulation
const themeManager = (() => {
  let instance;
  
  return {
    getInstance: () => {
      if (!instance) {
        instance = new ThemeManagerV2();
      }
      return instance;
    },
    
    // Convenience methods
    toggle: () => {
      return getInstance().toggle();
    },
    
    setTheme: (theme) => {
      return getInstance().setTheme(theme);
    },
    
    getTheme: () => {
      return getInstance().getTheme();
    },
    
    getPreferences: () => {
      return getInstance().getPreferences();
    },
    
    syncAfterLogin: () => {
      return getInstance().syncAfterLogin();
    },
    
    clearPreference: () => {
      return getInstance().clearPreference();
    }
  };
  
  function getInstance() {
    return themeManager.getInstance();
  }
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, theme manager ready');
  });
} else {
  console.log('📄 DOM already loaded, theme manager ready');
}

// Backwards compatibility - also expose as global
window.themeManager = themeManager;
