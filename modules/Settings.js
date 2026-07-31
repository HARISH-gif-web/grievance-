// Settings.js - Manages secret department passkeys and office configurations
const Settings = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Settings</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Configure department parameters and security passkeys</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Manage Passkeys -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">🔒 Security Passkey Configuration</h3>
          
          <form id="settings-passkeys-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Select Department</label>
              <select id="settings-passkey-dept" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; background: #fff;">
                <option value="food">Food Department</option>
                <option value="education">Education Department</option>
                <option value="civic">Civic Infrastructure</option>
                <option value="health">Health Services</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">New Passkey Code</label>
              <input type="password" id="settings-passkey-val" placeholder="Enter new secret key" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none;" required>
            </div>

            <button type="submit" style="padding: 12px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;">
              Update Passkey
            </button>
          </form>
        </div>

        <!-- Office Details -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">🏢 Secretariat Office Profile</h3>
          
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Nodal Office Address</div>
              <div style="font-size: 13px; color: #334155; font-weight: 600; margin-top: 2px;">MeitY Secretariat, New Delhi, India</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Technical Hotline Support</div>
              <div style="font-size: 13px; color: #334155; font-weight: 600; margin-top: 2px;">+91-11-24360199</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Official Domain URL</div>
              <div style="font-size: 13px; color: #334155; font-weight: 600; margin-top: 2px;">https://www.meity.gov.in/</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('settings-passkeys-form').addEventListener('submit', this.handlePasskeyUpdate);
  },

  handlePasskeyUpdate(e) {
    e.preventDefault();
    const department = document.getElementById('settings-passkey-dept').value;
    const passkey = document.getElementById('settings-passkey-val').value.trim();

    const token = localStorage.getItem('prajamitra_token');
    fetch((window.API_BASE || '') + '/api/settings/update-passkey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ department, passkey })
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      alert('Secret passcode updated successfully!');
      document.getElementById('settings-passkey-val').value = '';
    })
    .catch(err => alert('Failed to update passkey.'));
  }
};

window.Settings = Settings;
