// accessibility.js - Controls accessibility toggles, translation loading, auth modals, and menus across all pages.

document.addEventListener('DOMContentLoaded', () => {
  injectAccessibilityLayouts();
  checkAuthStatus();
  initAccessibilityFeatures();
});

// 1. Inject Dynamic HTML Layouts (Skip Link, Accessibility Settings Panel, Auth Modal, Hamburger Drawer)
function injectAccessibilityLayouts() {
  // A. Skip to Main Content Link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.innerText = 'Skip to Main Content';
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Set main-content ID on correct wrapper
  const wrap = document.querySelector('.wrap, main');
  if (wrap) wrap.id = 'main-content';

  // B. Accessibility Floating Settings Panel
  const panel = document.createElement('div');
  panel.id = 'accessibility-panel';
  panel.className = 'access-panel';
  panel.innerHTML = `
    <div class="access-panel-header">
      <h4>♿ Accessibility Controls</h4>
      <button onclick="toggleAccessPanel()">×</button>
    </div>
    <div class="access-panel-body">
      <div class="access-option">
        <span>Dark Mode</span>
        <button class="access-btn" id="btn-dark-toggle" onclick="toggleDarkMode()">Toggle</button>
      </div>
      <div class="access-option">
        <span>High Contrast</span>
        <button class="access-btn" id="btn-contrast-toggle" onclick="toggleHighContrast()">Toggle</button>
      </div>
      <div class="access-option">
        <span>Text-To-Speech (TTS)</span>
        <button class="access-btn" id="btn-tts-toggle" onclick="toggleTTS()">Enable</button>
      </div>
      <div class="access-option">
        <span>Keyboard Focus Outline</span>
        <button class="access-btn" id="btn-kb-toggle" onclick="toggleKeyboardNav()">Disable</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Hook up button in gov-strip (remove screen record / old size text buttons)
  const govRight = document.querySelector('.gov-strip .gov-right');
  if (govRight) {
    govRight.innerHTML = `
      <span class="item">
        <select id="language" style="border:none; background:transparent; font-weight:600; cursor:pointer;">
          <option value="en">🌐 English</option>
          <option value="te">🌐 Telugu (తెలుగు)</option>
          <option value="hi">🌐 Hindi (हिन्दी)</option>
          <option value="ta">🌐 Tamil (தமிழ்)</option>
          <option value="ml">🌐 Malayalam (മലയാളം)</option>
          <option value="kn">🌐 Kannada (ಕನ್ನಡ)</option>
        </select>
      </span>
      <span class="item" onclick="toggleAccessPanel()" style="font-weight:600;">♿ Accessibility Setting</span>
      <span class="item" onclick="toggleDarkMode()" style="font-size:16px; cursor:pointer;">🌓 Theme</span>
    `;
    
    // Bind change language event to translation controller
    const langSelect = document.getElementById('language');
    if (langSelect && typeof changeLanguage === 'function') {
      langSelect.value = localStorage.getItem('prajamitra_lang') || 'en';
      langSelect.addEventListener('change', (e) => {
        changeLanguage(e.target.value);
      });
    }
  }

  // C. Authentications Modal (Login & Register)
  const authModal = document.createElement('div');
  authModal.id = 'auth-modal-overlay';
  authModal.className = 'modal-overlay';
  authModal.innerHTML = `
    <div class="modal-card" style="max-width: 440px; padding: 30px; text-align: left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <h3 id="auth-modal-title" style="margin:0;">Citizen Login</h3>
        <button type="button" onclick="closeAuthModal()" style="border:none; background:none; font-size:24px; cursor:pointer; color:#64748b;">×</button>
      </div>
      
      <!-- Login View -->
      <div id="login-view">
        <form onsubmit="submitLogin(event)">
          <div class="form-group">
            <label>Email Address <span class="required">*</span></label>
            <input type="email" id="login-email" class="form-control" placeholder="name@example.com" required>
          </div>
          <div class="form-group">
            <label>Password <span class="required">*</span></label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top: 10px;">Login</button>
        </form>
        <p style="text-align:center; font-size:13px; margin-top:20px; color:#64748b;">
          New User? <span onclick="switchAuthView('register')" style="color:#1f7a3f; font-weight:700; cursor:pointer;">Register Here</span>
        </p>
      </div>

      <!-- Register View -->
      <div id="register-view" style="display:none;">
        <form onsubmit="submitRegister(event)">
          <div class="form-group">
            <label>Email Address <span class="required">*</span></label>
            <input type="email" id="reg-email" class="form-control" placeholder="name@example.com" required>
          </div>
          <div class="form-group">
            <label>Mobile Number <span class="required">*</span></label>
            <div class="input-with-action">
              <input type="tel" id="reg-phone" class="form-control" placeholder="10-digit number" pattern="[0-9]{10}" required>
              <button type="button" class="action-addon-btn" id="reg-otp-btn" onclick="sendAuthOTP()">Send OTP</button>
            </div>
          </div>
          <div class="form-group" id="reg-otp-box" style="display:none;">
            <label>OTP Code <span class="required">*</span></label>
            <input type="text" id="reg-otp-input" class="form-control" placeholder="Enter OTP (Enter 2026)">
            <span class="upload-hint" style="color:#16a34a;" id="reg-otp-status">Enter code 2026 to verify phone.</span>
          </div>
          <div class="form-group">
            <label>Password <span class="required">*</span></label>
            <input type="password" id="reg-password" class="form-control" placeholder="Minimum 6 characters" required>
          </div>
          <div class="form-group">
            <label>Confirm Password <span class="required">*</span></label>
            <input type="password" id="reg-confirm" class="form-control" placeholder="Confirm password" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top: 15px;">Register Account</button>
        </form>
        <p style="text-align:center; font-size:13px; margin-top:20px; color:#64748b;">
          Already have an account? <span onclick="switchAuthView('login')" style="color:#1f7a3f; font-weight:700; cursor:pointer;">Login Here</span>
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(authModal);

  // D. Hamburger Drawer Menu
  const drawer = document.createElement('div');
  drawer.id = 'hamburger-drawer';
  drawer.className = 'side-drawer';
  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="brand">
        <div class="brand-logo" style="width:36px; height:36px; font-size:16px;">👥</div>
        <div class="brand-name" style="font-size:20px;">PrajaMitra</div>
      </div>
      <button onclick="toggleDrawer()">×</button>
    </div>
    <div class="drawer-body">
      <a href="main.html" class="drawer-link">🏠 Home</a>
      <a href="complaint.html" class="drawer-link">📝 Lodge Grievance</a>
      <a href="track.html" class="drawer-link">📍 Status Tracker</a>
      <a href="track.html?view=my-complaints" class="drawer-link">📋 My Grievances</a>
      <div style="margin-top:40px; padding-top:20px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b;">
        <p>© 2026 National Informatics Centre.</p>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  // Hook login and menu buttons in header
  const header = document.querySelector('header.header');
  if (header) {
    // Replace login, voice, and menu buttons with dynamic targets
    const oldLogin = header.querySelector('.login-btn');
    const oldMenu = header.querySelector('.menu-btn');
    const oldVoice = header.querySelector('.voice-btn');
    
    if (oldVoice) {
      oldVoice.outerHTML = `
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="voice-btn" onclick="startHeaderVoiceSearch()">
            <span class="mic">🎤</span> <span data-translate="voice_search">Voice Search</span>
          </button>
          <button class="emergency-header-btn" onclick="triggerVoiceEmergency()">
            🚨 <span data-translate="voice_emergency">Voice Emergency</span>
          </button>
        </div>
      `;
    }
    if (oldLogin) oldLogin.outerHTML = `<div id="auth-header-wrapper" style="margin-left:auto;"><button class="login-btn" onclick="openAuthModal()">👤 Login / Register</button></div>`;
    if (oldMenu) oldMenu.outerHTML = `<button class="menu-btn" onclick="toggleDrawer()" style="margin-left: 12px;">☰</button>`;
  }
}

// 2. Accessibility Feature Logics (TTS, Dark Theme, Contrast)
let isTTSActive = false;
let synthesisSpeech = window.speechSynthesis;

function initAccessibilityFeatures() {
  // Apply saved theme state
  if (localStorage.getItem('prajamitra_dark') === 'true') {
    document.body.classList.add('dark-mode');
  }
  if (localStorage.getItem('prajamitra_contrast') === 'true') {
    document.body.classList.add('high-contrast');
  }
  if (localStorage.getItem('prajamitra_kb') === 'false') {
    document.body.classList.add('no-kb-focus');
    const btn = document.getElementById('btn-kb-toggle');
    if (btn) btn.innerText = 'Enable';
  }

  // TTS hover reader setup
  document.addEventListener('mouseover', (e) => {
    if (!isTTSActive) return;
    const target = e.target;
    // Read only descriptive texts, labels, buttons, headers
    if (['H1', 'H2', 'H3', 'H4', 'P', 'LABEL', 'BUTTON', 'SPAN', 'A'].includes(target.tagName)) {
      speakText(target.innerText || target.value || target.placeholder || '');
    }
  });
}

function toggleAccessPanel() {
  const panel = document.getElementById('accessibility-panel');
  panel.classList.toggle('active');
}

function toggleDarkMode() {
  const active = document.body.classList.toggle('dark-mode');
  localStorage.setItem('prajamitra_dark', active);
}

function toggleHighContrast() {
  const active = document.body.classList.toggle('high-contrast');
  localStorage.setItem('prajamitra_contrast', active);
}

function toggleTTS() {
  isTTSActive = !isTTSActive;
  const btn = document.getElementById('btn-tts-toggle');
  if (btn) {
    btn.innerText = isTTSActive ? 'Disable' : 'Enable';
    btn.style.backgroundColor = isTTSActive ? '#dc2626' : '#cbd5e1';
    btn.style.color = isTTSActive ? '#fff' : '#475569';
  }
  if (isTTSActive) {
    speakText('Text to speech mode activated. Hover over text elements to read them.');
  } else {
    synthesisSpeech.cancel();
  }
}

function toggleKeyboardNav() {
  const active = document.body.classList.toggle('no-kb-focus');
  localStorage.setItem('prajamitra_kb', !active);
  const btn = document.getElementById('btn-kb-toggle');
  if (btn) btn.innerText = active ? 'Enable' : 'Disable';
}

function speakText(text) {
  if (!text.trim()) return;
  synthesisSpeech.cancel(); // Stop current speech
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to set language voice matching site language
  const currentLang = localStorage.getItem('prajamitra_lang') || 'en';
  utterance.lang = currentLang;
  
  synthesisSpeech.speak(utterance);
}

// 3. Hamburger Side Drawer
function toggleDrawer() {
  const drawer = document.getElementById('hamburger-drawer');
  drawer.classList.toggle('active');
}

// ==========================================================================
// AUTHENTICATION LOGIC & MODALS
// ==========================================================================
function openAuthModal() {
  const modal = document.getElementById('auth-modal-overlay');
  modal.classList.add('active');
  switchAuthView('login');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal-overlay');
  modal.classList.remove('active');
}

function switchAuthView(viewName) {
  const loginView = document.getElementById('login-view');
  const regView = document.getElementById('register-view');
  const title = document.getElementById('auth-modal-title');
  
  if (viewName === 'login') {
    loginView.style.display = 'block';
    regView.style.display = 'none';
    title.innerText = 'Citizen Login';
  } else {
    loginView.style.display = 'none';
    regView.style.display = 'block';
    title.innerText = 'Citizen Registration';
  }
}

// OTP simulated flow
let isAuthPhoneVerified = false;
function sendAuthOTP() {
  const phone = document.getElementById('reg-phone').value;
  if (!phone || phone.length !== 10) {
    alert('Please enter a valid 10-digit mobile number!');
    return;
  }
  document.getElementById('reg-otp-btn').innerText = 'Sending...';
  setTimeout(() => {
    document.getElementById('reg-otp-box').style.display = 'block';
    document.getElementById('reg-otp-btn').innerText = 'Resend OTP';
    alert('OTP Sent! Enter 2026 to verify.');
    
    // Bind instant verification listener
    document.getElementById('reg-otp-input').addEventListener('input', (e) => {
      if (e.target.value === '2026') {
        isAuthPhoneVerified = true;
        document.getElementById('reg-otp-status').innerText = '✓ Phone verified successfully!';
        document.getElementById('reg-otp-status').style.color = '#1f7a3f';
        document.getElementById('reg-otp-input').disabled = true;
        document.getElementById('reg-otp-btn').innerText = 'Verified ✓';
        document.getElementById('reg-otp-btn').disabled = true;
      }
    });
  }, 1000);
}

// Submit Register API Call
function submitRegister(e) {
  e.preventDefault();
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (password !== confirm) {
    alert('Passwords do not match!');
    return;
  }
  if (!isAuthPhoneVerified) {
    alert('Please verify your mobile number with OTP code 2026!');
    return;
  }

  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, phone, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      alert('Registration successful! Please login.');
      switchAuthView('login');
    }
  })
  .catch(err => {
    console.error(err);
    alert('Error connecting to backend server. Ensure the server is running!');
  });
}

// Submit Login API Call
function submitLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      // Save details
      localStorage.setItem('prajamitra_token', data.token);
      localStorage.setItem('prajamitra_user_email', data.user.email);
      localStorage.setItem('prajamitra_user_phone', data.user.phone);
      
      closeAuthModal();
      checkAuthStatus();
      location.reload(); // Reload to refresh page auth states
    }
  })
  .catch(err => {
    console.error(err);
    alert('Error connecting to backend server. Ensure the server is running!');
  });
}

// Check if user is authenticated and update header representation
function checkAuthStatus() {
  const token = localStorage.getItem('prajamitra_token');
  const email = localStorage.getItem('prajamitra_user_email');
  const authWrapper = document.getElementById('auth-header-wrapper');
  
  if (token && email && authWrapper) {
    const userName = email.split('@')[0];
    authWrapper.innerHTML = `
      <div class="profile-dropdown-container">
        <button class="login-btn profile-trigger" onclick="toggleProfileMenu()">
          👤 ${userName} <span style="font-size:10px; margin-left:4px;">▼</span>
        </button>
        <div class="profile-dropdown-menu" id="profile-dropdown-menu">
          <a href="#" class="drop-item">My Profile</a>
          <a href="track.html?view=my-complaints" class="drop-item">My Complaints</a>
          <a href="#" class="drop-item">Notifications <span class="badge-new" style="margin-left:auto;">2</span></a>
          <a href="#" class="drop-item">Settings</a>
          <div style="border-top:1px solid #e2e8f0; margin:6px 0;"></div>
          <a href="#" class="drop-item logout" onclick="userLogout()" style="color:#ef4444;">Logout ↩</a>
        </div>
      </div>
    `;
  }
}

function toggleProfileMenu() {
  const menu = document.getElementById('profile-dropdown-menu');
  if (menu) menu.classList.toggle('active');
}

function userLogout() {
  localStorage.removeItem('prajamitra_token');
  localStorage.removeItem('prajamitra_user_email');
  localStorage.removeItem('prajamitra_user_phone');
  location.href = 'main.html';
}

// Close dropdowns on outside click
window.addEventListener('click', (e) => {
  if (!e.target.closest('.profile-dropdown-container')) {
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) menu.classList.remove('active');
  }
});

// ==========================================================================
// DYNAMIC VOICE ASSISTANCE & EMERGENCY SERVICES
// ==========================================================================
let emergencyAudioRecorder = null;
let emergencyAudioChunks = [];
let emergencyGPSCoords = { lat: null, lng: null };

function triggerVoiceEmergency() {
  let modal = document.getElementById('emergency-modal-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'emergency-modal-overlay';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 420px; padding: 30px;">
      <h3 style="color:#ef4444; margin:0 0 10px;">🚨 Emergency Voice Lodge</h3>
      <p style="font-size:13px; color:#64748b;">Recording will start automatically to capture details of the emergency incident.</p>
      
      <div class="emergency-recording-indicator" id="emerg-recording-box">
        <div class="recording-pulse-circle"></div>
        <h4 id="emerg-timer-label" style="margin:0;">Recording: 4s remaining</h4>
        <span style="font-size:11px; color:#94a3b8;">Speak clearly into your microphone...</span>
      </div>

      <div style="font-size:12px; color:#1f7a3f; display:none; margin: 15px 0;" id="emerg-gps-status">
        ✓ GPS coordinates successfully acquired.
      </div>
      
      <div id="emerg-loading-spinner" style="display:none; font-size:13px; font-weight:700; color:#1f7a3f; margin: 15px 0;">
        ⏳ Transmitting emergency report directly to portal...
      </div>
    </div>
  `;
  
  modal.classList.add('active');

  // Request Permissions & Record
  Promise.all([
    navigator.mediaDevices.getUserMedia({ audio: true }),
    new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          emergencyGPSCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          resolve(true);
        },
        (err) => {
          emergencyGPSCoords = { lat: 16.3067, lng: 80.4365 }; // Fallback
          resolve(false);
        },
        { timeout: 3000 }
      );
    })
  ])
  .then(([stream, gpsSuccess]) => {
    if (gpsSuccess) {
      const gpsLabel = document.getElementById('emerg-gps-status');
      if (gpsLabel) gpsLabel.style.display = 'block';
    }
    startEmergencyAudioRecording(stream);
  })
  .catch(err => {
    alert('Microphone permission is required for emergency voice lodging!');
    modal.classList.remove('active');
  });
}

function startEmergencyAudioRecording(stream) {
  emergencyAudioRecorder = new MediaRecorder(stream);
  emergencyAudioChunks = [];

  emergencyAudioRecorder.ondataavailable = (e) => {
    emergencyAudioChunks.push(e.data);
  };

  emergencyAudioRecorder.onstop = () => {
    const audioBlob = new Blob(emergencyAudioChunks, { type: 'audio/wav' });
    stream.getTracks().forEach(t => t.stop());
    submitEmergencyGrievance(audioBlob);
  };

  emergencyAudioRecorder.start();
  
  let timeLeft = 4;
  const timerLabel = document.getElementById('emerg-timer-label');
  const timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (emergencyAudioRecorder.state !== 'inactive') {
        emergencyAudioRecorder.stop();
      }
    } else {
      if (timerLabel) timerLabel.innerText = `Recording: ${timeLeft}s remaining`;
    }
  }, 1000);
}

function submitEmergencyGrievance(audioBlob) {
  const recordBox = document.getElementById('emerg-recording-box');
  const spinner = document.getElementById('emerg-loading-spinner');
  
  if (recordBox) recordBox.style.display = 'none';
  if (spinner) spinner.style.display = 'block';

  const formData = new FormData();
  formData.append('category', 'Emergency');
  formData.append('subcategory', 'Voice Incident');
  formData.append('title', 'Emergency Voice Report');
  formData.append('description', 'Grievance lodged directly via one-click emergency voice record.');
  formData.append('severity', 'High');
  formData.append('anonymous', 'true');
  formData.append('latitude', emergencyGPSCoords.lat || '16.3067');
  formData.append('longitude', emergencyGPSCoords.lng || '80.4365');
  formData.append('audio', audioBlob, 'emergency.wav');

  fetch('/api/complaints', {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error('API failure');
    return res.json();
  })
  .then(data => {
    const modal = document.getElementById('emergency-modal-overlay');
    modal.querySelector('.modal-card').innerHTML = `
      <div class="success-checkmark-wrap" style="width:64px; height:64px; font-size:32px; margin-bottom:16px;">✓</div>
      <h3 style="color:#1f7a3f; margin-bottom:8px;">🚨 Emergency Lodged!</h3>
      <p style="font-size:13px; color:#64748b; margin-bottom:16px;">Your emergency incident has been auto-submitted with GPS location and voice files.</p>
      
      <div class="ticket-info-box" style="padding:12px; margin-bottom:20px; font-size:13px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span>Ticket ID:</span>
          <b style="font-family:monospace; color:#1f7a3f;">${data.id}</b>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Department:</span>
          <b>${data.dept}</b>
        </div>
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" onclick="document.getElementById('emergency-modal-overlay').classList.remove('active')" style="flex:1; justify-content:center;">Close</button>
        <button class="btn btn-primary" onclick="location.href='track.html?id=${data.id}'" style="flex:1; justify-content:center;">Track Status</button>
      </div>
    `;
  })
  .catch(err => {
    console.error(err);
    alert('Failed to submit emergency report to portal server. Check connection.');
    document.getElementById('emergency-modal-overlay').classList.remove('active');
  });
}

function startHeaderVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = localStorage.getItem('prajamitra_lang') || 'en';
  
  const voiceBtn = document.querySelector('.voice-btn');
  const oldText = voiceBtn.innerHTML;
  voiceBtn.innerHTML = '🎙️ Listening...';
  
  recognition.onresult = function(event) {
    const text = event.results[0][0].transcript;
    voiceBtn.innerHTML = oldText;
    
    const q = text.toLowerCase();
    
    if (typeof speakText === 'function') {
      speakText('Voice command received: redirecting.');
    }
    
    if (q.includes('road') || q.includes('pothole') || q.includes('street') || q.includes('garbage') || q.includes('streetlight') || q.includes('highway') || q.includes('drainage')) {
      location.href = 'comregister.html#civic';
    } else if (q.includes('ration') || q.includes('food') || q.includes('canteen') || q.includes('water') || q.includes('meal') || q.includes('welfare')) {
      location.href = 'comregister.html#food';
    } else if (q.includes('school') || q.includes('education') || q.includes('college') || q.includes('scholarship') || q.includes('teacher') || q.includes('fee')) {
      location.href = 'comregister.html#education';
    } else if (q.includes('hospital') || q.includes('doctor') || q.includes('medicine') || q.includes('health') || q.includes('ambulance') || q.includes('clinic')) {
      location.href = 'comregister.html#health';
    } else if (q.includes('home')) {
      location.href = 'main.html';
    } else if (q.includes('track') || q.includes('status')) {
      const ticketMatch = q.match(/pm-\d{4}-x\d{5}/i) || q.match(/\d{5}/);
      if (ticketMatch) {
        let ticketNum = ticketMatch[0].toUpperCase();
        if (!ticketNum.startsWith('PM')) {
          ticketNum = 'PM-2026-X' + ticketNum;
        }
        location.href = `track.html?id=${ticketNum}`;
      } else {
        location.href = 'track.html';
      }
    } else if (q.includes('register') || q.includes('lodge')) {
      location.href = 'complaint.html';
    } else {
      alert(`Voice Command: "${text}" not mapped. Say Roads, Food, Health, Education, Home, or Track.`);
    }
  };
  
  recognition.onerror = function() {
    voiceBtn.innerHTML = oldText;
  };
  recognition.start();
}

