/**
 * FixBuddy Settings Synchronization
 * Listens for settings changes across pages and applies them in real-time
 */

class SettingsSync {
  constructor() {
    this.listeners = {};
    this.initSettingsListener();
  }

  /**
   * Initialize settings listener for BroadcastChannel
   */
  initSettingsListener() {
    try {
      if (window.BroadcastChannel) {
        this.channel = new BroadcastChannel('fixbuddy-settings');
        this.channel.addEventListener('message', (event) => {
          this.handleSettingsUpdate(event.data);
        });
      } else {
        console.warn('BroadcastChannel not supported - settings changes may not sync across tabs');
      }
    } catch (err) {
      console.warn('Could not initialize settings sync:', err);
    }
  }

  /**
   * Handle incoming settings updates
   */
  handleSettingsUpdate(message) {
    if (message.type !== 'SETTINGS_UPDATED') return;

    console.log('Settings update received:', message.settingType, message.data);

    // Apply settings based on type
    switch (message.settingType) {
      case 'general':
        this.applyGeneralSettings(message.data);
        break;
      case 'appearance':
        this.applyAppearanceSettings(message.data);
        break;
      case 'security':
        this.applySecuritySettings(message.data);
        break;
      case 'notification':
        this.applyNotificationSettings(message.data);
        break;
      case 'profile':
        this.applyProfileSettings(message.data);
        break;
      default:
        break;
    }

    // Trigger custom event for other scripts to listen
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: {
        settingType: message.settingType,
        data: message.data
      }
    }));
  }

  /**
   * Apply general settings
   */
  applyGeneralSettings(data) {
    // Update system name across pages
    if (data.systemName) {
      const logoElement = document.querySelector('.logo span');
      if (logoElement) {
        logoElement.textContent = data.systemName;
      }
    }

    // Store in sessionStorage for current session
    sessionStorage.setItem('generalSettings', JSON.stringify(data));
  }

  /**
   * Apply appearance settings
   */
  applyAppearanceSettings(data) {
    // Dark mode is handled by themeManager-v2.js

    // Apply compact menu if applicable
    if (data.compactMenu !== undefined) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        if (data.compactMenu) {
          sidebar.classList.add('compact');
        } else {
          sidebar.classList.remove('compact');
        }
      }
    }

    // Apply animations setting
    if (data.showAnimations !== undefined) {
      const root = document.documentElement;
      if (!data.showAnimations) {
        root.style.setProperty('--animation-duration', '0s');
      } else {
        root.style.removeProperty('--animation-duration');
      }
    }

    // Store appearance settings
    localStorage.setItem('appearanceSettings', JSON.stringify(data));
  }

  /**
   * Apply security settings
   */
  applySecuritySettings(data) {
    // Security settings are mainly backend-enforced
    sessionStorage.setItem('securitySettings', JSON.stringify(data));
  }

  /**
   * Apply notification settings
   */
  applyNotificationSettings(data) {
    // Store notification settings for the app to use
    localStorage.setItem('notificationSettings', JSON.stringify(data));
  }

  /**
   * Apply profile settings
   */
  applyProfileSettings(data) {
    // Update admin profile in localStorage
    if (data.name || data.phone) {
      const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
      if (data.name) adminData.name = data.name;
      if (data.phone) adminData.phone = data.phone;
      localStorage.setItem('admin', JSON.stringify(adminData));

      // Update display if applicable
      const adminWelcome = document.getElementById('adminWelcome');
      if (adminWelcome && data.name) {
        adminWelcome.textContent = `👤 ${data.name}`;
      }
    }
  }

  /**
   * Register a custom listener for settings changes
   */
  on(settingType, callback) {
    if (!this.listeners[settingType]) {
      this.listeners[settingType] = [];
    }
    this.listeners[settingType].push(callback);
  }

  /**
   * Remove a listener
   */
  off(settingType, callback) {
    if (this.listeners[settingType]) {
      this.listeners[settingType] = this.listeners[settingType].filter(cb => cb !== callback);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
  }
}

// Initialize SettingsSync globally
window.settingsSync = new SettingsSync();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (window.settingsSync) {
    window.settingsSync.destroy();
  }
});
