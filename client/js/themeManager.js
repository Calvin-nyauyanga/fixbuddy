/**
 * Theme Manager
 * Handles dark mode UI and local storage
 * Waits for user authentication before making API calls
 */

class ThemeManager {
  constructor() {
    this.isDarkMode = false;
    this.toggleButton = null;
    this.isAuthenticated = false;
    this.init();
  }

  /**
   * Initialize theme manager
   */
  async init() {
    // Check if user is authenticated
    this.checkAuthentication();

    // Load preference from localStorage or API
    await this.loadThemePreference();

    // Apply theme to DOM
    this.applyTheme();

    // Setup toggle button
    this.setupToggleButton();

    console.log('✅ Theme Manager Initialized');
  }

  /**
   * Check if user is authenticated
   */
  checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    this.isAuthenticated = !!(token && user);
  }

  /**
   * Load theme preference from API or localStorage
   */
  async loadThemePreference() {
    try {
      // Only call API if user is authenticated
      if (this.isAuthenticated) {
        try {
          const result = await themeAPI.getDarkModePreference();

          if (result.success) {
            this.isDarkMode = result.data.darkmode;
            localStorage.setItem('theme-preference', this.isDarkMode ? 'dark' : 'light');
            console.log('✅ Loaded theme preference from API');
            return;
          }
        } catch (apiError) {
          console.warn('Could not load from API, falling back to localStorage:', apiError.message);
        }
      }

      // Fallback to localStorage
      const savedTheme = localStorage.getItem('theme-preference');
      this.isDarkMode = savedTheme === 'dark';
      console.log('✅ Loaded theme preference from localStorage');
    } catch (error) {
      console.error('Error loading theme preference:', error);
      this.isDarkMode = false;
    }
  }

  /**
   * Apply theme to DOM
   */
  applyTheme() {
    const htmlElement = document.documentElement;

    if (this.isDarkMode) {
      htmlElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      htmlElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }

    // Update toggle button state
    if (this.toggleButton) {
      this.updateToggleButtonState();
    }
  }

  /**
   * Setup toggle button
   */
  setupToggleButton() {
    this.toggleButton = document.querySelector('.theme-toggle');

    if (!this.toggleButton) {
      console.warn('Theme toggle button not found');
      return;
    }

    this.toggleButton.addEventListener('click', () => this.toggle());
    this.updateToggleButtonState();
  }

  /**
   * Update toggle button appearance
   */
  updateToggleButtonState() {
    if (!this.toggleButton) return;

    if (this.isDarkMode) {
      this.toggleButton.textContent = '☀️';
      this.toggleButton.title = 'Switch to Light Mode';
    } else {
      this.toggleButton.textContent = '🌙';
      this.toggleButton.title = 'Switch to Dark Mode';
    }
  }

  /**
   * Toggle dark mode
   */
  async toggle() {
    try {
      this.toggleButton.disabled = true;

      // Check authentication again
      this.checkAuthentication();

      if (!this.isAuthenticated) {
        alert('Please login to change theme settings');
        this.toggleButton.disabled = false;
        return;
      }

      const result = await themeAPI.toggleDarkMode();

      if (result.success) {
        this.isDarkMode = result.data.darkmode;
        localStorage.setItem('theme-preference', this.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
        console.log(`✅ Dark mode toggled to: ${this.isDarkMode}`);
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);

      // Fallback: toggle locally without API
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('theme-preference', this.isDarkMode ? 'dark' : 'light');
      this.applyTheme();
      console.log('⚠️ Toggled theme locally (API unavailable)');
    } finally {
      this.toggleButton.disabled = false;
    }
  }

  /**
   * Get current theme status
   */
  getTheme() {
    return this.isDarkMode ? 'dark' : 'light';
  }

  /**
   * Sync theme after login
   * Call this function after user logs in successfully
   */
  async syncAfterLogin() {
    console.log('🔄 Syncing theme after login...');
    this.checkAuthentication();
    await this.loadThemePreference();
    this.applyTheme();
  }
}

// Create global instance
const themeManager = new ThemeManager();