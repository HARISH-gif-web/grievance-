// Notifications.js - Broadcaster center for announcements and notifications
const Notifications = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">Broadcaster Center</h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Send alerts and announcements to citizens</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Create Broadcast -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02);">
          <h3 style="margin: 0 0 20px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">Create Announcement Broadcast</h3>
          
          <form id="broadcast-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Broadcast Category Target</label>
              <select id="broadcast-category" style="padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; background: #fff;">
                <option value="all">All Citizens</option>
                <option value="food">Food Department Consumers</option>
                <option value="civic">Civic / Infrastructure Subscriptions</option>
                <option value="education">Education Department Students/Parents</option>
                <option value="health">Public Health Services</option>
              </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Announcement Message</label>
              <textarea id="broadcast-message" rows="5" placeholder="Enter the update message here..." style="padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13px; outline: none; font-family: inherit; resize: none;" required></textarea>
            </div>

            <button type="submit" style="padding: 12px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
              📢 Send Announcement Broadcast
            </button>
          </form>
        </div>

        <!-- Sent Logs -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.02); display: flex; flex-direction: column;">
          <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: #0f172a; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">Broadcast History Logs</h3>
          <div id="broadcast-history-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; max-height: 380px; padding-right: 6px;">
            <p style="text-align: center; color: #94a3b8; font-size: 13px; margin: 40px 0;">No broadcast announcements issued yet.</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('broadcast-form').addEventListener('submit', this.handleBroadcastSubmit);
    this.loadHistory();
  },

  handleBroadcastSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('broadcast-category').value;
    const message = document.getElementById('broadcast-message').value.trim();

    const token = localStorage.getItem('prajamitra_token');
    fetch((window.API_BASE || '') + '/api/notifications/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ category, message })
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      alert('Broadcast announcement transmitted successfully!');
      document.getElementById('broadcast-message').value = '';
      Notifications.loadHistory();
    })
    .catch(err => alert('Failed to send broadcast announcement.'));
  },

  loadHistory() {
    // Standard mock list combined with dynamic alerts
    const container = document.getElementById('broadcast-history-list');
    if (!container) return;

    // In a premium app we fetch sent notifications or use local store alerts
    container.innerHTML = `
      <div style="border-left: 3px solid #FF9933; padding: 12px 16px; background: #fffaf0; border-radius: 0 10px 10px 0; border: 1px solid #ffe8cc; border-left-width: 3px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">
          <span>All Citizens</span>
          <span>Just Now</span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #334155; line-height: 1.4;">Scheduled civic maintenance on the main road grid starts tomorrow at 9:00 AM.</p>
      </div>

      <div style="border-left: 3px solid #10b981; padding: 12px 16px; background: #f0fdf4; border-radius: 0 10px 10px 0; border: 1px solid #d1fae5; border-left-width: 3px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">
          <span>Public Health</span>
          <span>2 Hours Ago</span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #334155; line-height: 1.4;">Vaccination booths are open at all ward hospitals. Walk-ins are welcome.</p>
      </div>
    `;
  }
};

window.Notifications = Notifications;
