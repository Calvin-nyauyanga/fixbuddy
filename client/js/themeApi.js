/**
 * Theme/Dark Mode API Client
 * Handles all dark mode related API calls
 */

const API_BASE = 'http://localhost:5000/api';

function getAuthToken() {
  return localStorage.getItem('authToken');
}

const themeAPI = {
  /**
   * Get user's dark mode preference
   */
  getDarkModePreference: async () => {
    try {
      const response = await fetch(`${API_BASE}/theme/dark-mode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dark mode preference: ${response.status}`);
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
      const response = await fetch(`${API_BASE}/theme/dark-mode`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ darkmode }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update dark mode preference: ${response.status}`);
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
      const response = await fetch(`${API_BASE}/theme/dark-mode/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle dark mode: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      throw error;
    }
  },
};