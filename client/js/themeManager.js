/**
 * Theme Manager
 * Handles dark mode UI and local storage
 */

class ThemeManager {
  constructor() {
    this.isDarkMode = false;
    this.toggleButton = null;
    this.init();
  }

  /**
   * Initialize theme manager
   */
  async init() {
    // Load preference from localStorage or API
    await this.loadThemePreference();
    
    // Apply theme to DOM
    this.applyTheme();
    
    // Setup toggle button
    this.setupToggleButton();
    
    console.log('✅ Theme Manager Initialized');
  }

  /**
   * Load theme preference from API
   */
  async loadThemePreference() {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // If no auth, use localStorage fallback
        const savedTheme = localStorage.getItem('theme-preference');
        this.isDarkMode = savedTheme === 'dark';
        return;
      }

      const result = await themeAPI.getDarkModePreference();
      
      if (result.success) {
        this.isDarkMode = result.data.darkmode;
        localStorage.setItem('theme-preference', this.isDarkMode ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to localStorage
      const savedTheme = localStorage.getItem('theme-preference');
      this.isDarkMode = savedTheme === 'dark';
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
      
      const result = await themeAPI.toggleDarkMode();
      
      if (result.success) {
        this.isDarkMode = result.data.darkmode;
        localStorage.setItem('theme-preference', this.isDarkMode ? 'dark' : 'light');
        this.applyTheme();
        console.log(`✅ Dark mode toggled to: ${this.isDarkMode}`);
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      alert('Failed to toggle dark mode');
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
}

// Create global instance
const themeManager = new ThemeManager();