/**
 * Dashboard Widgets
 * Reusable components for displaying queue and team status
 */

const DashboardWidgets = {
  /**
   * Render queue status widget
   */
  renderQueueStatus(containerId, queueData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <!-- Queue 1: General Support -->
        <div style="padding: 12px; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); border-radius: 6px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 6px;">General Support</div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 24px; font-weight: bold;" class="queue-general">${queueData.general || 0}</span>
            <span style="font-size: 11px; opacity: 0.9;">waiting</span>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.3); border-radius: 3px;">
            <div class="queue-general-bar" style="width: 0%; height: 100%; background: rgba(255,255,255,0.9); border-radius: 3px; transition: width 0.3s;"></div>
          </div>
        </div>

        <!-- Queue 2: Technical Issues -->
        <div style="padding: 12px; background: linear-gradient(135deg, #ff9800 0%, #fb8c00 100%); border-radius: 6px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 6px;">Technical Issues</div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 24px; font-weight: bold;" class="queue-technical">${queueData.technical || 0}</span>
            <span style="font-size: 11px; opacity: 0.9;">waiting</span>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.3); border-radius: 3px;">
            <div class="queue-technical-bar" style="width: 0%; height: 100%; background: rgba(255,255,255,0.9); border-radius: 3px; transition: width 0.3s;"></div>
          </div>
        </div>
      </div>

      <!-- Second Row: Billing & Account -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <!-- Queue 3: Billing & Account -->
        <div style="padding: 12px; background: linear-gradient(135deg, #f44336 0%, #e53935 100%); border-radius: 6px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 6px;">Billing & Account</div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 24px; font-weight: bold;" class="queue-billing">${queueData.billing || 0}</span>
            <span style="font-size: 11px; opacity: 0.9;">waiting</span>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.3); border-radius: 3px;">
            <div class="queue-billing-bar" style="width: 0%; height: 100%; background: rgba(255,255,255,0.9); border-radius: 3px; transition: width 0.3s;"></div>
          </div>
        </div>

        <!-- Total Queue Summary -->
        <div style="padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 6px;">Total Queue</div>
          <div style="display: flex; align-items: baseline; gap: 6px;">
            <span style="font-size: 24px; font-weight: bold;" class="queue-total">${queueData.total || 0}</span>
            <span style="font-size: 11px; opacity: 0.9;">tickets</span>
          </div>
        </div>
      </div>
    `;

    // Update progress bars
    this.updateQueueBars(queueData);
  },

  /**
   * Update queue progress bars
   */
  updateQueueBars(queueData) {
    const maxQueueSize = Math.max(
      queueData.general || 0,
      queueData.technical || 0,
      queueData.billing || 0,
      1
    );

    const generalPercent = ((queueData.general || 0) / maxQueueSize) * 100;
    const technicalPercent = ((queueData.technical || 0) / maxQueueSize) * 100;
    const billingPercent = ((queueData.billing || 0) / maxQueueSize) * 100;

    document.querySelectorAll('.queue-general-bar').forEach(el => el.style.width = generalPercent + '%');
    document.querySelectorAll('.queue-technical-bar').forEach(el => el.style.width = technicalPercent + '%');
    document.querySelectorAll('.queue-billing-bar').forEach(el => el.style.width = billingPercent + '%');
  },

  /**
   * Render team status widget
   */
  renderTeamStatus(containerId, teamData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const capacityUsage = Number(teamData.capacityUsage) || 0;
    const buffer = Number(teamData.buffer) || 0;

    container.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 12px; height: 12px; background: #4caf50; border-radius: 50%; margin-right: 8px;"></div>
          <span>Available</span>
          <strong style="margin-left: auto; color: #4caf50;" class="team-available">${teamData.agentsAvailable || 0}</strong>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 12px; height: 12px; background: #ffc107; border-radius: 50%; margin-right: 8px;"></div>
          <span>On Break</span>
          <strong style="margin-left: auto; color: #ffc107;" class="team-break">${teamData.agentsBreak || 0}</strong>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 12px; height: 12px; background: #f44336; border-radius: 50%; margin-right: 8px;"></div>
          <span>Away</span>
          <strong style="margin-left: auto; color: #f44336;" class="team-away">${teamData.agentsAway || 0}</strong>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 12px; height: 12px; background: #9e9e9e; border-radius: 50%; margin-right: 8px;"></div>
          <span>Offline</span>
          <strong style="margin-left: auto; color: #9e9e9e;" class="team-offline">${teamData.agentsOffline || 0}</strong>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 15px;">
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
            <strong>Capacity Usage</strong>
          </div>
          <div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; display: flex;">
            <div class="capacity-usage-bar" style="flex: ${capacityUsage}; background: linear-gradient(to right, #4caf50, #ff9800); border-radius: 10px 0 0 10px;"></div>
            <div class="capacity-buffer-bar" style="flex: ${buffer}; background: #e0e0e0; border-radius: 0 10px 10px 0;"></div>
          </div>
          <div style="font-size: 12px; color: #999; margin-top: 6px;">
            <span class="capacity-percentage">${capacityUsage}</span>% utilized | <span class="capacity-buffer">${buffer}</span>% buffer
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Create a compact queue status header
   */
  renderCompactQueue(queueData) {
    return `
      <div style="display: flex; gap: 1rem; align-items: center; background: #f5f5f5; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
        <div style="flex: 1;">
          <small style="color: #666;">Queue Status:</small>
          <div style="font-weight: bold; font-size: 1.2rem;">
            ${queueData.total || 0} <small style="font-size: 0.8rem; color: #999;">total tickets waiting</small>
          </div>
        </div>
        <div style="display: flex; gap: 1rem;">
          <div style="text-align: center;">
            <div style="font-size: 0.75rem; color: #666;">General</div>
            <strong style="font-size: 1.5rem; color: #4caf50;">${queueData.general || 0}</strong>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 0.75rem; color: #666;">Technical</div>
            <strong style="font-size: 1.5rem; color: #ff9800;">${queueData.technical || 0}</strong>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 0.75rem; color: #666;">Billing</div>
            <strong style="font-size: 1.5rem; color: #f44336;">${queueData.billing || 0}</strong>
          </div>
        </div>
      </div>
    `;
  }
};

window.DashboardWidgets = DashboardWidgets;