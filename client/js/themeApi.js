/**
 * Theme/Dark Mode API Client
 * Handles all dark mode related API calls
 */

const THEME_API_BASE = 'http://localhost:5000/api';

function getAuthToken() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('⚠️ No auth token found');
  }
  return token;
}

const themeAPI = {
  /**
   * Get user's dark mode preference
   */
  getDarkModePreference: async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Not authenticated - no token available');
      }

      const response = await fetch(`${THEME_API_BASE}/theme/dark-mode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.message || 'Failed to fetch dark mode preference'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dark mode preference:', error);
      throw error;
    }
  },

  /**
   * Update dark mode preference
   */
  updateDarkModePreference: async (darkmode) => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Not authenticated - no token available');
      }

      const response = await fetch(`${THEME_API_BASE}/theme/dark-mode`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ darkmode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.message || 'Failed to update dark mode preference'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating dark mode preference:', error);
      throw error;
    }
  },

  /**
   * Toggle dark mode on/off
   */
  toggleDarkMode: async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Not authenticated - no token available');
      }

      const response = await fetch(`${THEME_API_BASE}/theme/dark-mode/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.message || 'Failed to toggle dark mode'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      throw error;
    }
  },
};