// Users.js - Manages platform users listing, role updates, and deletions
const Users = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Users</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Manage system users and their roles</p>
        </div>
      </div>

      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
        <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
          <input type="text" id="user-search-input" placeholder="Search user..." style="padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; width: 220px;">
        </div>
        <div style="overflow-x: auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Primary Phone</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('user-search-input').addEventListener('input', (e) => {
      filterUsersTable(e.target.value);
    });

    this.loadData();
  },

  loadData() {
    const token = localStorage.getItem('prajamitra_token');
    if (!token) return;

    fetch((window.API_BASE || '') + '/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(users => {
      const tbody = document.getElementById('users-table-body');
      tbody.innerHTML = '';
      if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:16px; text-align:center; color:#94a3b8;">No registered platform users available.</td></tr>`;
        return;
      }
      
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f1f5f9';
        tr.innerHTML = `
          <td style="padding:12px; font-size:13px; color:#0f172a; font-weight:600;">${u.email}</td>
          <td style="padding:12px; font-size:13px; color:#475569;">${u.phone || 'N/A'}</td>
          <td style="padding:12px; font-size:13px;">
            <select onchange="Users.updateUserRole('${u.id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:11px; outline:none; background:#fff; cursor:pointer; font-weight:700;">
              <option value="Citizen" ${u.role === 'Citizen' ? 'selected' : ''}>Citizen</option>
              <option value="Authority" ${u.role === 'Authority' ? 'selected' : ''}>Authority</option>
            </select>
          </td>
          <td style="padding:12px; font-size:13px;">
            <select onchange="Users.updateUserDepartment('${u.id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1; font-size:11px; outline:none; background:#fff; cursor:pointer; font-weight:700;">
              <option value="N/A" ${u.department === 'N/A' ? 'selected' : ''}>N/A</option>
              <option value="Food" ${u.department === 'Food' ? 'selected' : ''}>Food</option>
              <option value="Civic" ${u.department === 'Civic' || u.department === 'Civic infrastructure' ? 'selected' : ''}>Civic</option>
              <option value="Education" ${u.department === 'Education' ? 'selected' : ''}>Education</option>
              <option value="Health" ${u.department === 'Health' ? 'selected' : ''}>Health</option>
              <option value="Other" ${u.department === 'Other' || u.department === 'Others' ? 'selected' : ''}>Other</option>
            </select>
          </td>
          <td style="padding:12px; font-size:13px; color:#475569;">
            <span style="color:#1f7a3f; font-weight:700; background:#f0fdf4; padding:2px 6px; border-radius:4px; font-size:11px;">Active</span>
          </td>
          <td style="padding:12px; text-align:right;">
            <button class="btn" onclick="deleteUser('${u.id}')" style="background:#fee2e2; color:#b91c1c; border:none; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:700; margin:0;">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error(err));
  },

  updateUserRole(userId, newRole) {
    const token = localStorage.getItem('prajamitra_token');
    fetch((window.API_BASE || '') + '/api/users/update-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: userId, role: newRole })
    })
    .then(res => {
      if (!res.ok) throw new Error();
      alert('User role updated successfully!');
      this.loadData();
    })
    .catch(err => alert('Failed to update user role.'));
  },

  updateUserDepartment(userId, newDept) {
    const token = localStorage.getItem('prajamitra_token');
    fetch((window.API_BASE || '') + '/api/users/update-department', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: userId, department: newDept })
    })
    .then(res => {
      if (!res.ok) throw new Error();
      alert('User department assignment updated successfully!');
      this.loadData();
    })
    .catch(err => alert('Failed to update user department.'));
  }
};

window.Users = Users;
