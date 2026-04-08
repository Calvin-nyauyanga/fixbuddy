/**
 * Shared Dashboard Module
 * Manages live queue status and team status across all admin pages
 */

class DashboardModule {
  constructor() {
    this.queueData = {};
    this.teamData = {};
    this.pollingInterval = null;
    this.lastUpdateTime = null;
  }

  /**
   * Initialize the dashboard module
   * @param {Object} options - Configuration options
   * @param {boolean} options.autoRefresh - Enable auto-refresh (default: true)
   * @param {number} options.refreshInterval - Refresh interval in ms (default: 30000)
   */
  async initialize(options = {}) {
    const {
      autoRefresh = true,
      refreshInterval = 30000
    } = options;

    // Load initial data
    await this.refreshQueueStatus();
    await this.refreshTeamStatus();

    // Setup auto-refresh if enabled
    if (autoRefresh) {
      this.startAutoRefresh(refreshInterval);
    }

    console.log('✅ Dashboard Module Initialized');
  }

  /**
   * Fetch queue status from backend
   */
  async refreshQueueStatus() {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/queue-status', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch queue status');

      const data = await response.json();
      this.queueData = data.data || {};
      this.lastUpdateTime = new Date();

      // Dispatch custom event for pages to listen
      this.dispatchEvent('queueStatusUpdated', this.queueData);
      console.log('✅ Queue Status Updated:', this.queueData);
    } catch (error) {
      console.error('❌ Error loading queue status:', error);
    }
  }

  /**
   * Fetch team status from backend
   */
  async refreshTeamStatus() {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/team-status', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch team status');

      const data = await response.json();
      this.teamData = data.data || {};
      this.lastUpdateTime = new Date();

      // Dispatch custom event for pages to listen
      this.dispatchEvent('teamStatusUpdated', this.teamData);
      console.log('✅ Team Status Updated:', this.teamData);
    } catch (error) {
      console.error('❌ Error loading team status:', error);
    }
  }

  /**
   * Start auto-refresh polling
   */
  startAutoRefresh(interval) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(async () => {
      await Promise.all([
        this.refreshQueueStatus(),
        this.refreshTeamStatus(),
      ]);
    }, interval);

    console.log(`✅ Auto-refresh started (${interval}ms)`);
  }

  /**
   * Stop auto-refresh polling
   */
  stopAutoRefresh() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('✅ Auto-refresh stopped');
    }
  }

  /**
   * Get current queue data
   */
  getQueueData() {
    return this.queueData;
  }

  /**
   * Get current team data
   */
  getTeamData() {
    return this.teamData;
  }

  /**
   * Dispatch custom event
   */
  dispatchEvent(eventName, data) {
    const event = new CustomEvent(eventName, {
      detail: data
    });
    document.dispatchEvent(event);
  }

  /**
   * Listen to queue status updates
   */
  onQueueStatusUpdated(callback) {
    document.addEventListener('queueStatusUpdated', (e) => callback(e.detail));
  }

  /**
   * Listen to team status updates
   */
  onTeamStatusUpdated(callback) {
    document.addEventListener('teamStatusUpdated', (e) => callback(e.detail));
  }
}

// Create global instance
const dashboardModule = new DashboardModule();
window.dashboardModule = dashboardModule;