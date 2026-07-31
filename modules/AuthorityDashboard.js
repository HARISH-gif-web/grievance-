// AuthorityDashboard.js - Manages metrics, recent complaints and charts
const AuthorityDashboard = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Authority Admin Dashboard</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Manage departments, users and monitor grievances</p>
      </div>

      <!-- Top Metrics Row -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <div style="width: 48px; height: 48px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 20px;">🏛️</div>
          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">Departments</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 2px;" id="metrics-dept-count">0</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Total Departments</div>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <div style="width: 48px; height: 48px; border-radius: 10px; background: #faf5ff; color: #9333ea; display: flex; align-items: center; justify-content: center; font-size: 20px;">👥</div>
          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">Users</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 2px;" id="metrics-users-count">0</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Total Users</div>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <div style="width: 48px; height: 48px; border-radius: 10px; background: #fff7ed; color: #ea580c; display: flex; align-items: center; justify-content: center; font-size: 20px;">📋</div>
          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">Complaints</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 2px;" id="metrics-complaints-count">0</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Total Complaints</div>
          </div>
        </div>
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <div style="width: 48px; height: 48px; border-radius: 10px; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 20px;">✅</div>
          <div>
            <div style="font-size: 12px; color: #64748b; font-weight: 600;">Resolved</div>
            <div style="font-size: 24px; font-weight: 800; color: #16a34a; margin-top: 2px;" id="metrics-resolved-count">0</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Resolved Complaints</div>
          </div>
        </div>
      </div>

      <!-- Graphs Grid -->
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; margin-bottom: 30px;">
        <!-- Complaint Overview -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">Complaint Overview</h3>
            <select style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; color: #64748b;">
              <option>This Year</option>
            </select>
          </div>
          <div id="line-chart-container" style="height: 220px; display: flex; align-items: flex-end; justify-content: space-between; position: relative;"></div>
        </div>

        <!-- Complaints by Status -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Complaints by Status</h3>
          <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
            <div id="donut-chart-container" style="position: relative; width: 140px; height: 140px;"></div>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: #475569;" id="donut-legend"></div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Recent Complaints & Quick Actions -->
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px;">
        <!-- Recent Complaints List -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">Recent Complaints</h3>
          <div style="display: flex; flex-direction: column; gap: 14px;" id="dashboard-recent-list"></div>
        </div>

        <!-- Quick Actions List -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02); display: flex; flex-direction: column; gap: 12px;">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Quick Actions</h3>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="switchAuthSubTab('add-dept')">
            <span style="font-size: 13px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px;">➕ Add Department</span>
            <span style="color: #94a3b8;">&rsaquo;</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="switchAuthSubTab('users')">
            <span style="font-size: 13px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px;">👥 Manage Users</span>
            <span style="color: #94a3b8;">&rsaquo;</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="switchAuthSubTab('complaints')">
            <span style="font-size: 13px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px;">📋 View All Complaints</span>
            <span style="color: #94a3b8;">&rsaquo;</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="switchAuthSubTab('reports')">
            <span style="font-size: 13px; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 8px;">📊 Generate Report</span>
            <span style="color: #94a3b8;">&rsaquo;</span>
          </div>
        </div>
      </div>
    `;
    this.loadData();
  },

  loadData() {
    loadAuthorityDashboard();
  }
};

window.AuthorityDashboard = AuthorityDashboard;
