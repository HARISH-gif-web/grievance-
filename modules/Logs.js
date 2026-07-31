// Logs.js - System Audit Logs view for Authority Admin
const Logs = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Audit Logs</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Monitor system security events and authority actions</p>
        </div>
        <button onclick="Logs.clearLogs()" class="btn btn-secondary" style="border-color: #ef4444; color: #ef4444; background: #fff; font-weight: 700; cursor: pointer; border-radius: 6px; margin: 0; padding: 8px 16px;">
          🗑️ Clear Audit Logs
        </button>
      </div>

      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
          <input type="text" id="logs-search-input" placeholder="Search audit logs..." style="padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; width: 220px;">
        </div>
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action Event</th>
                <th>Target Element</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="logs-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
        
        <!-- Pagination UI matching user mockup -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 13px; color: #64748b;">
          <span>Showing 1 to 5 of 15 entries</span>
          <div style="display: flex; gap: 4px;" id="logs-pagination">
            <button class="pag-btn" disabled>&lsaquo;</button>
            <button class="pag-btn active">1</button>
            <button class="pag-btn">2</button>
            <button class="pag-btn">3</button>
            <button class="pag-btn">&rsaquo;</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('logs-search-input').addEventListener('input', (e) => {
      Logs.filterLogs(e.target.value);
    });

    this.loadLogs();
  },

  loadLogs() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;

    // Static mockup data representing recent audit events
    const logsData = [
      { time: "31 Jul 2026 at 11:33 AM", operator: "System Router", event: "Auto-Routed Complaint", target: "PM-2026-X15489", status: "Success" },
      { time: "31 Jul 2026 at 11:20 AM", operator: "food_admin@gov.in", event: "Resolved Complaint", target: "PM-2026-X50275", status: "Success" },
      { time: "31 Jul 2026 at 10:29 AM", operator: "System Router", event: "Auto-Routed Voice Complaint", target: "PM-2026-X57024", status: "Success" },
      { time: "31 Jul 2026 at 09:59 AM", operator: "health_admin@gov.in", event: "Changed Status (Investigating)", target: "PM-2026-X93633", status: "Success" },
      { time: "30 Jul 2026 at 12:45 PM", operator: "System Router", event: "Auto-Classified AI Category", target: "Pothole Search Query", status: "Success" }
    ];

    tbody.innerHTML = '';
    logsData.forEach(log => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f1f5f9';
      tr.innerHTML = `
        <td style="padding:12px; font-size:13px; color:#475569;">${log.time}</td>
        <td style="padding:12px; font-size:13px; color:#0f172a; font-weight:600;">${log.operator}</td>
        <td style="padding:12px; font-size:13px; color:#1f7a3f; font-weight:600;">${log.event}</td>
        <td style="padding:12px; font-size:13px; color:#475569; font-family: monospace;">${log.target}</td>
        <td style="padding:12px; font-size:13px;">
          <span style="color:#1f7a3f; font-weight:700; background:#f0fdf4; padding:2px 6px; border-radius:4px; font-size:11px;">${log.status}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  filterLogs(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#logs-table-body tr');
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  },

  clearLogs() {
    if (confirm('Are you sure you want to purge all system audit logs? This action is irreversible.')) {
      alert('Audit logs cleared successfully!');
      const tbody = document.getElementById('logs-table-body');
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:#94a3b8;">No audit log events recorded yet.</td></tr>`;
    }
  }
};

window.Logs = Logs;
