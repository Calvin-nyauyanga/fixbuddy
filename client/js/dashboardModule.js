/**
 * Shared Dashboard Module
 * Manages live queue status and team status across all admin pages
 * ✅ FULLY CONNECTED TO BACKEND
 */

class DashboardModule {
  constructor() {
    this.queueData = {
      general: 0,
      technical: 0,
      billing: 0,
      total: 0
    };
    this.teamData = {
      agentsAvailable: 0,
      agentsBreak: 0,
      agentsAway: 0,
      agentsOffline: 0,
      totalAgents: 0,
      capacityUsage: 0,
      buffer: 100
    };
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

    console.log('🚀 Initializing Dashboard Module...');

    try {
      // Load initial data from backend
      await this.refreshQueueStatus();
      await this.refreshTeamStatus();

      // Setup auto-refresh if enabled
      if (autoRefresh) {
        this.startAutoRefresh(refreshInterval);
      }

      console.log('✅ Dashboard Module Initialized Successfully');
    } catch (error) {
      console.error('❌ Dashboard initialization error:', error);
      throw error;
    }
  }

  /**
   * Fetch queue status from backend
   * Backend endpoint: GET /api/dashboard/queue-status
   */
  async refreshQueueStatus() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      console.log('📋 Fetching queue status...');

      const response = await fetch('http://localhost:5000/api/dashboard/queue-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch queue status: ${response.status} ${errorData.message || ''}`);
      }

      const data = await response.json();
      
      // Extract data from response (handle both nested and flat structures)
      const queueDataRaw = data.data || data || {};

      // Normalize the data structure
      this.queueData = {
        general: Number(queueDataRaw.general) || 0,
        technical: Number(queueDataRaw.technical) || 0,
        billing: Number(queueDataRaw.billing) || 0,
        total: (Number(queueDataRaw.general) || 0) + (Number(queueDataRaw.technical) || 0) + (Number(queueDataRaw.billing) || 0)
      };

      this.lastUpdateTime = new Date();

      // Dispatch custom event for pages to listen
      this.dispatchEvent('queueStatusUpdated', this.queueData);
      console.log('✅ Queue Status Updated:', this.queueData);

      return this.queueData;
    } catch (error) {
      console.error('❌ Error loading queue status:', error);
      
      // Set default empty data on error (dashboard will show 0s)
      this.queueData = {
        general: 0,
        technical: 0,
        billing: 0,
        total: 0
      };
      
      // Dispatch with default data so UI updates
      this.dispatchEvent('queueStatusUpdated', this.queueData);
      
      // Don't throw - let dashboard continue working with default data
      return this.queueData;
    }
  }

  /**
   * Fetch team status from backend
   * Backend endpoint: GET /api/dashboard/team-status
   */
  async refreshTeamStatus() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      console.log('👥 Fetching team status...');

      const response = await fetch('http://localhost:5000/api/dashboard/team-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch team status: ${response.status} ${errorData.message || ''}`);
      }

      const data = await response.json();
      
      // Extract data from response
      const teamDataRaw = data.data || data || {};

      // Normalize the data structure
      this.teamData = {
        agentsAvailable: Number(teamDataRaw.agentsAvailable) || 0,
        agentsBreak: Number(teamDataRaw.agentsBreak) || 0,
        agentsAway: Number(teamDataRaw.agentsAway) || 0,
        agentsOffline: Number(teamDataRaw.agentsOffline) || 0,
        totalAgents: Number(teamDataRaw.totalAgents) || 0,
        capacityUsage: Number(teamDataRaw.capacityUsage) || 0,
        buffer: Number(teamDataRaw.buffer) || 100
      };

      this.lastUpdateTime = new Date();

      // Dispatch custom event for pages to listen
      this.dispatchEvent('teamStatusUpdated', this.teamData);
      console.log('✅ Team Status Updated:', this.teamData);

      return this.teamData;
    } catch (error) {
      console.error('❌ Error loading team status:', error);
      
      // Set default empty data on error
      this.teamData = {
        agentsAvailable: 0,
        agentsBreak: 0,
        agentsAway: 0,
        agentsOffline: 0,
        totalAgents: 0,
        capacityUsage: 0,
        buffer: 100
      };
      
      // Dispatch with default data so UI updates
      this.dispatchEvent('teamStatusUpdated', this.teamData);
      
      // Don't throw - let dashboard continue working with default data
      return this.teamData;
    }
  }

  /**
   * Start auto-refresh polling
   */
  startAutoRefresh(interval) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(async () => {
      try {
        await Promise.all([
          this.refreshQueueStatus(),
          this.refreshTeamStatus(),
        ]);
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
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

  /**
   * Debug method to check API connectivity and data
   */
  async debug() {
    console.log('🔍 Dashboard Module Debug Info:');
    console.log('- Queue Data:', this.queueData);
    console.log('- Team Data:', this.teamData);
    console.log('- Auth Token:', localStorage.getItem('authToken') ? '✅ Present' : '❌ Missing');
    console.log('- Last Update:', this.lastUpdateTime);
    
    try {
      console.log('\n🧪 Testing Queue Status Endpoint...');
      const queueResponse = await fetch('http://localhost:5000/api/dashboard/queue-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      console.log('Queue Status Response:', queueResponse.status, await queueResponse.json());
    } catch (error) {
      console.error('Queue Status Error:', error);
    }

    try {
      console.log('\n🧪 Testing Team Status Endpoint...');
      const teamResponse = await fetch('http://localhost:5000/api/dashboard/team-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      console.log('Team Status Response:', teamResponse.status, await teamResponse.json());
    } catch (error) {
      console.error('Team Status Error:', error);
    }
  }
}

// Create global instance
const dashboardModule = new DashboardModule();
window.dashboardModule = dashboardModule;