// Profile.js - Authority Nodal Officer Profile and Password Management
const Profile = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const email = localStorage.getItem('prajamitra_user_email') || 'nodal.officer@gov.in';
    const userName = email.split('@')[0];
    const dept = localStorage.getItem('prajamitra_is_authority') === 'true' ? 'Nodal Ministry Admin' : 'Citizen Nodal Office';

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Account Profile</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Manage your personnel details and credential settings</p>
      </div>

      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 24px;">
        <!-- Left Side: Profile Summary Card -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.02); display: flex; flex-direction: column; align-items: center; text-align: center;">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 20px;" />
          <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #0f172a;">${userName.toUpperCase()}</h3>
          <span style="font-size: 12px; font-weight: 700; color: #1f7a3f; background: #f0fdf4; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">${dept}</span>
          
          <div style="width: 100%; border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 20px; display: flex; flex-direction: column; gap: 12px; text-align: left; font-size: 13px;">
            <div>
              <span style="font-weight: 700; color: #64748b; display: block; font-size: 11px; text-transform: uppercase;">Email Address</span>
              <span style="color: #334155; font-weight: 600; word-break: break-all;">${email}</span>
            </div>
            <div>
              <span style="font-weight: 700; color: #64748b; display: block; font-size: 11px; text-transform: uppercase;">Authorized ID</span>
              <span style="color: #334155; font-weight: 600; font-family: monospace;">PM-AUTH-2026-928A</span>
            </div>
            <div>
              <span style="font-weight: 700; color: #64748b; display: block; font-size: 11px; text-transform: uppercase;">System Privileges</span>
              <span style="color: #334155; font-weight: 600;">Super Admin Access</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Edit Password / Settings Forms -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.02); display: flex; flex-direction: column; gap: 24px;">
          <div>
            <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 800; color: #0f172a;">Personal Specifications</h3>
            <p style="margin: 0; color: #64748b; font-size: 13px;">Review and configure your portal profile settings</p>
          </div>

          <form id="profile-edit-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">First Name</label>
              <input type="text" value="${userName.split('.')[0] || 'Nodal'}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Last Name</label>
              <input type="text" value="${userName.split('.')[1] || 'Officer'}" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; grid-column: span 2;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Designation Title</label>
              <input type="text" value="Secretariat Nodal Desk Officer" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none;">
            </div>
            <div style="grid-column: span 2; margin-top: 8px;">
              <button type="submit" onclick="event.preventDefault(); alert('Profile credentials updated successfully!');" class="btn btn-primary" style="margin: 0; background: #1f7a3f; border-color: #1f7a3f; padding: 10px 20px;">Save Profile Settings</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
};

window.Profile = Profile;
