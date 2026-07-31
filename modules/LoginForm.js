// LoginForm.js - Handles Admin Login Screen and GSAP Animations
const LoginForm = {
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <!-- TOP GOVERNMENT STRIP -->
      <header class="gov-strip" id="admin-gov-strip" style="position: fixed; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 8px 24px; font-size: 11px; font-weight: 700; color: #475569; z-index: 100; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0; background: rgba(255, 255, 255, 0.9); border-bottom: 1px solid rgba(0,0,0,0.06);">
        <div class="gov-left" style="display: flex; align-items: center; gap: 8px;">
          <img class="gov-flag" src="https://upload.wikimedia.org/wikipedia/commons/4/41/Flag_of_India.svg" alt="Tricolor Flag" style="height: 12px; width: auto;" />
          <span>Government of India</span>
        </div>
      </header>

      <!-- Background blurred circles -->
      <div class="login-background" id="admin-login-bg" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index:-2; opacity:0; background: radial-gradient(circle at 10% 20%, #f1f5f9 0%, #e2e8f0 100%);">
        <div class="bg-blur-circle-1" style="position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(22, 163, 74, 0.08) 0%, rgba(22, 163, 74, 0) 70%); top: -150px; left: -150px; border-radius: 50%; filter: blur(60px);"></div>
        <div class="bg-blur-circle-2" style="position: absolute; width: 700px; height: 700px; background: radial-gradient(circle, rgba(255, 153, 51, 0.06) 0%, rgba(255, 153, 51, 0) 70%); bottom: -200px; right: -200px; border-radius: 50%; filter: blur(80px);"></div>
      </div>

      <!-- Sweeping Ribbon SVG -->
      <svg id="admin-silk-ribbons" width="100%" height="100%" style="position: absolute; top:0; left:0; pointer-events: none; z-index: 2;">
        <path id="admin-ribbon-saffron" d="" fill="none" stroke="#FF9933" stroke-width="0" stroke-linecap="round" opacity="0.65" />
        <path id="admin-ribbon-white" d="" fill="none" stroke="#FFFFFF" stroke-width="0" stroke-linecap="round" opacity="0.75" />
        <path id="admin-ribbon-green" d="" fill="none" stroke="#128807" stroke-width="0" stroke-linecap="round" opacity="0.65" />
      </svg>

      <!-- Flying Flag -->
      <svg id="admin-flying-flag" width="140" height="90" viewBox="0 0 120 80" style="position: absolute; z-index: 10; opacity: 0; pointer-events: none;">
        <path d="M0,0 Q30,12 60,0 T120,0 L120,26 Q90,38 60,26 T0,26 Z" fill="#FF9933"></path>
        <path d="M0,26 Q30,38 60,26 T120,26 L120,53 Q90,65 60,53 T0,53 Z" fill="#FFFFFF"></path>
        <path d="M0,53 Q30,65 60,53 T120,53 L120,80 Q90,92 60,80 T0,80 Z" fill="#128807"></path>
        <circle cx="60" cy="39" r="10" fill="none" stroke="#000080" stroke-width="1"></circle>
        <circle cx="60" cy="39" r="2" fill="#000080"></circle>
        <line x1="60" y1="29" x2="60" y2="49" stroke="#000080" stroke-width="0.5"></line>
        <line x1="50" y1="39" x2="70" y2="39" stroke="#000080" stroke-width="0.5"></line>
      </svg>

      <!-- Central Emblem & Chakra -->
      <div class="emblem-container" id="admin-emblem-wrap" style="position: relative; display: flex; align-items: center; justify-content: center; width: 300px; height: 300px;">
        <svg id="admin-chakra" width="220" height="220" viewBox="0 0 100 100" style="position: absolute; pointer-events: none; z-index:1;">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#000080" stroke-width="2.5" opacity="0.8"></circle>
          <circle cx="50" cy="50" r="8" fill="none" stroke="#000080" stroke-width="2"></circle>
          <g id="admin-spokes-group"></g>
        </svg>
        <div class="glowing-ring" id="admin-ring" style="position: absolute; width: 190px; height: 190px; border-radius: 50%; border: 3px solid transparent; background: linear-gradient(to right, #ff9933, #ffffff, #16a34a) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: destination-out; mask-composite: exclude; opacity: 0; z-index: 3;"></div>
        <img id="admin-emblem-img" src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="State Emblem of India" style="position: absolute; height: 160px; z-index: 2; opacity: 0;" />
        <div class="emblem-shine" id="admin-shine" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 55%, transparent 70%); background-size: 200% 100%; mix-blend-mode: overlay; pointer-events: none; opacity: 0;"></div>
      </div>

      <!-- GLASSMORPHIC CARD -->
      <div id="admin-login-card" style="width: 100%; max-width: 440px; padding: 40px; background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 24px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); z-index: 10; display: flex; flex-direction: column; align-items: center; opacity: 0; transform: translateY(40px); margin-top:-40px;">
        <div id="admin-emblem-dock" style="height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; position: relative; width: 100px;"></div>
        <h1 style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; margin-bottom: 2px;">PrajaMitra</h1>
        <div style="font-size: 11px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 30px;">Authority Admin</div>

        <form id="overlay-login-form" style="width: 100%;">
          <div class="form-group" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Select Department *</label>
            <select id="overlay-auth-dept" class="form-control" required style="padding:12px; border:1px solid #cbd5e1; border-radius:12px; font-size:14px; background:#fff; outline:none; font-family:inherit; width:100%;">
              <option value="food">Food Department</option>
              <option value="civic">Civic Infrastructure</option>
              <option value="education">Education</option>
              <option value="health">Health Department</option>
              <option value="others">Others</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Minister Email *</label>
            <input type="email" id="overlay-auth-email" class="form-control" placeholder="minister@gov.in" required style="padding:12px 14px; border:1px solid #cbd5e1; border-radius:12px; font-size:14px; outline:none; font-family:inherit; width:100%; background:transparent; color:#0f172a;" />
          </div>
          <div class="form-group" style="margin-bottom: 24px; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Passkey Code *</label>
            <input type="password" id="overlay-auth-passcode" class="form-control" placeholder="••••" required style="padding:12px 14px; border:1px solid #cbd5e1; border-radius:12px; font-size:14px; outline:none; font-family:inherit; width:100%; background:transparent; color:#0f172a;" />
          </div>

          <button type="submit" class="login-btn" style="width: 100%; padding: 14px; background: #16a34a; color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);">
            🔒 Authenticate Securely
          </button>
        </form>

        <div style="width: 100%; display: flex; justify-content: center; margin-top: 18px;">
          <a href="#" id="cancel-admin-overlay-btn" style="color: #475569; font-size: 13px; font-weight: 700; text-decoration: none;">❌ Cancel & Return</a>
        </div>
      </div>

      <!-- FOOTER -->
      <footer class="gov-footer" id="admin-gov-footer" style="position: fixed; bottom: 0; left: 0; width: 100%; padding: 16px; text-align: center; font-size: 10px; font-weight: 700; color: #475569; letter-spacing: 0.5px; z-index: 100; opacity: 0; background: rgba(255, 255, 255, 0.9); border-top: 1px solid rgba(0,0,0,0.06);">
        Ministry of Electronics & Information Technology &bull; Government of India
      </footer>
    `;

    document.getElementById('overlay-login-form').addEventListener('submit', this.handleLoginSubmit);
    document.getElementById('cancel-admin-overlay-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.cancel();
    });
  },

  startSequence() {
    startAdminLoginIntroSequence();
  },

  cancel() {
    cancelAdminLoginOverlay();
  },

  handleLoginSubmit(e) {
    e.preventDefault();
    submitAdminOverlayLogin(e);
  }
};

window.LoginForm = LoginForm;
