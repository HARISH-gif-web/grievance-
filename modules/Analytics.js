// Analytics.js - Department Performance and Grievance Resolution Trend Metrics
const Analytics = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Performance Analytics</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Monitor resolution times and case statistics across categories</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;">
        <!-- Resolution Time by Department -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">Avg. Resolution Speed (Days)</h3>
          <div id="analytics-bar-chart" style="height: 220px; display: flex; align-items: flex-end; justify-content: space-around; padding-bottom: 10px;"></div>
        </div>

        <!-- Comparative Case Resolution Rates -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">Department Resolution Rates</h3>
          <div style="display: flex; flex-direction: column; gap: 16px;" id="analytics-progress-bars"></div>
        </div>
      </div>

      <!-- Trend Performance Sheet -->
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Core Performance Statistics</h3>
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Cases</th>
                <th>Resolved Cases</th>
                <th>Average Resolution Days</th>
                <th>Performance Status</th>
              </tr>
            </thead>
            <tbody id="analytics-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    this.loadData();
  },

  loadData() {
    const token = localStorage.getItem('prajamitra_token');
    fetch((window.API_BASE || '') + '/api/authority/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      this.renderBarChart(data);
      this.renderProgressRates(data);
      this.renderTable(data);
    })
    .catch(err => console.error(err));
  },

  renderBarChart(data) {
    const chartContainer = document.getElementById('analytics-bar-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const colors = {
      food: '#ea580c',
      education: '#0052cc',
      civic: '#FF9933',
      health: '#d91424',
      other: '#6b21a8'
    };

    Object.keys(data).forEach(key => {
      const item = data[key];
      const val = item.average_days;
      // Max expected days is around 10 for scaling
      const heightPercent = Math.min((val / 10) * 100, 100);

      const column = document.createElement('div');
      column.style.display = 'flex';
      column.style.flexDirection = 'column';
      column.style.alignItems = 'center';
      column.style.flex = '1';
      column.style.height = '100%';
      column.style.justifyContent = 'flex-end';

      column.innerHTML = `
        <div style="font-size:11px; font-weight:800; color:#334155; margin-bottom:6px;">${val}d</div>
        <div style="width: 32px; height: ${heightPercent}%; background: ${colors[key] || '#64748b'}; border-radius: 6px 6px 0 0; transition: height 0.4s ease-out; box-shadow: 0 4px 8px rgba(0,0,0,0.05);"></div>
        <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 8px;">${item.category}</div>
      `;
      chartContainer.appendChild(column);
    });
  },

  renderProgressRates(data) {
    const list = document.getElementById('analytics-progress-bars');
    if (!list) return;
    list.innerHTML = '';

    const colors = {
      food: '#ea580c',
      education: '#0052cc',
      civic: '#FF9933',
      health: '#d91424',
      other: '#6b21a8'
    };

    Object.keys(data).forEach(key => {
      const item = data[key];
      const rate = item.total_cases > 0 ? Math.round((item.resolved_cases / item.total_cases) * 100) : 100;
      
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '6px';

      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#334155;">
          <span>${item.category}</span>
          <span>${rate}% (${item.resolved_cases}/${item.total_cases})</span>
        </div>
        <div style="width:100%; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
          <div style="width: ${rate}%; height:100%; background: ${colors[key] || '#64748b'}; border-radius:4px;"></div>
        </div>
      `;
      list.appendChild(row);
    });
  },

  renderTable(data) {
    const tbody = document.getElementById('analytics-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    Object.keys(data).forEach(key => {
      const item = data[key];
      const performance = item.average_days <= 4.0 ? 'Optimal' : item.average_days <= 6.0 ? 'Average' : 'Action Required';
      const color = performance === 'Optimal' ? '#16a34a' : performance === 'Average' ? '#ea580c' : '#ef4444';
      const bg = performance === 'Optimal' ? '#f0fdf4' : performance === 'Average' ? '#fff7ed' : '#fef2f2';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f1f5f9';
      tr.innerHTML = `
        <td style="padding:12px; font-size:13px; color:#0f172a; font-weight:600;">${item.category} Department</td>
        <td style="padding:12px; font-size:13px; color:#475569;">${item.total_cases}</td>
        <td style="padding:12px; font-size:13px; color:#475569;">${item.resolved_cases}</td>
        <td style="padding:12px; font-size:13px; color:#475569; font-weight:700;">${item.average_days} Days</td>
        <td style="padding:12px; font-size:13px;">
          <span style="color:${color}; font-weight:700; background:${bg}; padding:3px 8px; border-radius:6px; font-size:11px;">${performance}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
};

window.Analytics = Analytics;
