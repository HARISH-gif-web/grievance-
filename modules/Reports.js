// Reports.js - Handles report generation and compilation filters
const Reports = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Reports Portal</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Generate, filter, and export grievance summary sheets</p>
      </div>

      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02); max-width: 600px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">Export Filter Configurator</h3>
        
        <form id="report-filter-form" style="display: flex; flex-direction: column; gap: 18px;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Filter by Department</label>
            <select id="report-filter-dept" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; background: #fff;">
              <option value="all">All Departments / Categories</option>
              <option value="food">Food Department</option>
              <option value="civic">Civic Infrastructure</option>
              <option value="education">Education</option>
              <option value="health">Health Services</option>
              <option value="other">Others</option>
            </select>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Filter by Status</label>
            <select id="report-filter-status" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; background: #fff;">
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted / Under Review</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Start Date</label>
              <input type="date" id="report-start-date" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">End Date</label>
              <input type="date" id="report-end-date" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none;">
            </div>
          </div>

          <div style="margin-top: 10px; display: flex; gap: 12px;">
            <button type="button" onclick="Reports.exportData('csv')" style="flex: 1; padding: 12px; background: #1f7a3f; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(31,122,63,0.15);">
              📥 Export as CSV Spreadsheet
            </button>
            <button type="button" onclick="Reports.exportData('html')" style="flex: 1; padding: 12px; background: #0f172a; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;">
              📄 Generate Printable HTML Report
            </button>
          </div>
        </form>
      </div>
    `;
  },

  exportData(format) {
    const dept = document.getElementById('report-filter-dept').value;
    const status = document.getElementById('report-filter-status').value;
    const start = document.getElementById('report-start-date').value;
    const end = document.getElementById('report-end-date').value;

    const token = localStorage.getItem('prajamitra_token');
    
    // Fetch all complaints matching authority category filters
    fetch((window.API_BASE || '') + '/api/complaints/user-history?all=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(complaints => {
      let filtered = complaints.filter(c => {
        // Department filter
        if (dept !== 'all' && c.category !== dept) return false;
        // Status filter
        if (status !== 'all' && !c.status.includes(status)) return false;
        
        // Date filter
        if (start || end) {
          try {
            // date field is e.g. "July 29, 2026" or "31 Jul 2026 at 03:00 PM"
            // Let's parse just the start of date
            const dateObj = new Date(c.date);
            if (start && dateObj < new Date(start)) return false;
            if (end && dateObj > new Date(end)) return false;
          } catch(e) {}
        }
        return true;
      });

      if (format === 'csv') {
        this.downloadCSV(filtered);
      } else {
        this.openPrintableHTML(filtered);
      }
    })
    .catch(err => alert('Failed to compile report.'));
  },

  downloadCSV(data) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ticket ID,Category,Title,Description,Status,Date Submitted,Reporter Email,Anonymous\n";
    
    data.forEach(c => {
      const email = c.reporter ? c.reporter.email : 'N/A';
      const row = [
        c.id,
        c.category,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        c.status,
        c.date,
        email,
        c.anonymous ? 'Yes' : 'No'
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prajamitra_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  openPrintableHTML(data) {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
      <head>
        <title>PrajaMitra - Grievance Report Summary</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          h2 { color: #1f7a3f; border-bottom: 2px solid #1f7a3f; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h2>PrajaMitra Grievance Executive Summary</h2>
        <p>Report Generated On: ${new Date().toLocaleString()}</p>
        <p>Total Records Found: <strong>${data.length}</strong></p>
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Category</th>
              <th>Title</th>
              <th>Status</th>
              <th>Date Submitted</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(c => {
      html += `
        <tr>
          <td><strong>${c.id}</strong></td>
          <td>${c.category.toUpperCase()}</td>
          <td>${c.title}</td>
          <td>${c.status}</td>
          <td>${c.date}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

window.Reports = Reports;
