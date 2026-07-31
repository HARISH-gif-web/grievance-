// Departments.js - Manages departments table listings and updates
const Departments = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Departments</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">View and manage all departments</p>
        </div>
        <button class="btn btn-primary" onclick="switchAuthSubTab('add-dept')" style="margin: 0; background: #16a34a; border-color: #16a34a; display: flex; align-items: center; gap: 8px;">
          + Add Department
        </button>
      </div>

      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
          <input type="text" id="dept-search-input" placeholder="Search department..." style="padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; width: 220px;">
        </div>
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Type</th>
                <th>Contact Email</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="departments-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('dept-search-input').addEventListener('input', (e) => {
      filterDepartmentsTable(e.target.value);
    });

    this.loadData();
  },

  loadData() {
    loadDepartmentsTable();
  }
};

window.Departments = Departments;
