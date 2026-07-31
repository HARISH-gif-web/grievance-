// accessibility.js - Controls accessibility toggles, translation loading, auth modals, and menus across all pages.

window.API_BASE = (window.location.protocol === 'file:' || !window.location.host) ? 'http://localhost:3000' : '';

document.addEventListener('DOMContentLoaded', () => {
  injectAccessibilityLayouts();
  checkAuthStatus();
  initAccessibilityFeatures();
  initGlobalSearchHooks();
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
            <input type="tel" id="reg-phone" class="form-control" placeholder="10-digit number" pattern="[0-9]{10}" required>
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
      
      <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e2e8f0;">
        <h4 style="margin:0 0 12px; color:#ef4444; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">🚨 Emergency Helplines</h4>
        <div style="display:grid; gap:10px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:#fee2e2; border:1px solid #fecaca; border-radius:6px; padding:8px 12px;">
            <span style="font-weight:700; color:#991b1b;">National Response</span>
            <a href="tel:112" style="font-weight:800; color:#dc2626; text-decoration:none;">112</a>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:#fee2e2; border:1px solid #fecaca; border-radius:6px; padding:8px 12px;">
            <span style="font-weight:700; color:#991b1b;">Women Helpline</span>
            <a href="tel:1091" style="font-weight:800; color:#dc2626; text-decoration:none;">1091</a>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:#fee2e2; border:1px solid #fecaca; border-radius:6px; padding:8px 12px;">
            <span style="font-weight:700; color:#991b1b;">Citizen Support</span>
            <a href="tel:1800111122" style="font-weight:800; color:#dc2626; text-decoration:none;">1800-111-122</a>
          </div>
        </div>
      </div>

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
          <button class="voice-btn" onclick="toggleHeaderVoiceSearch()">
            <span class="mic">🎤</span> <span data-translate="voice_search">Voice Search</span>
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

  fetch(window.API_BASE + '/api/auth/register', {
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

  fetch(window.API_BASE + '/api/auth/login', {
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
          <a href="track.html?view=my-complaints" class="drop-item">My Complaints</a>
          <a href="#" class="drop-item" onclick="openSystemModal('notifications')">Notifications <span class="badge-new" style="margin-left:auto;">2</span></a>
          <a href="#" class="drop-item" onclick="openSystemModal('settings')">Settings</a>
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

  fetch(window.API_BASE + '/api/complaints', {
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

let headerVoiceRecognition = null;
let isHeaderVoiceRecording = false;

function toggleHeaderVoiceSearch() {
  const voiceBtn = document.querySelector('.voice-btn');
  if (!voiceBtn) return;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }
  
  if (isHeaderVoiceRecording) {
    if (headerVoiceRecognition) {
      headerVoiceRecognition.stop();
    }
    return;
  }
  
  headerVoiceRecognition = new SpeechRecognition();
  headerVoiceRecognition.lang = localStorage.getItem('prajamitra_lang') || 'en';
  headerVoiceRecognition.continuous = false;
  headerVoiceRecognition.interimResults = false;
  
  const oldText = voiceBtn.innerHTML;
  voiceBtn.innerHTML = '🎙️ Listening...';
  voiceBtn.style.backgroundColor = '#dc2626';
  voiceBtn.style.color = '#fff';
  isHeaderVoiceRecording = true;
  
  headerVoiceRecognition.onresult = function(event) {
    const text = event.results[0][0].transcript;
    voiceBtn.innerHTML = oldText;
    voiceBtn.style.backgroundColor = '';
    voiceBtn.style.color = '';
    isHeaderVoiceRecording = false;
    
    if (typeof speakText === 'function') {
      speakText('Searching for ' + text);
    }
    
    const searchInput = document.querySelector('header.header .search input');
    if (searchInput) searchInput.value = text;
    
    triggerAISearch(text);
  };
  
  headerVoiceRecognition.onerror = function() {
    voiceBtn.innerHTML = oldText;
    voiceBtn.style.backgroundColor = '';
    voiceBtn.style.color = '';
    isHeaderVoiceRecording = false;
  };
  
  headerVoiceRecognition.onend = function() {
    voiceBtn.innerHTML = oldText;
    voiceBtn.style.backgroundColor = '';
    voiceBtn.style.color = '';
    isHeaderVoiceRecording = false;
  };
  
  headerVoiceRecognition.start();
}

function triggerAISearch(query) {
  if (!query || !query.trim()) return;
  
  const searchBtn = document.querySelector('header.header .search button');
  const searchInput = document.querySelector('header.header .search input');
  let oldText = 'Search';
  if (searchBtn) {
    oldText = searchBtn.innerText;
    searchBtn.innerText = '⌛...';
    searchBtn.style.backgroundColor = '#d97706';
  }
  
  fetch((window.API_BASE || '') + '/api/ai/classify-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query })
  })
  .then(res => {
    if (!res.ok) throw new Error('API failed');
    return res.json();
  })
  .then(data => {
    if (searchBtn) {
      searchBtn.innerText = '✓ Success';
      searchBtn.style.backgroundColor = '#16a34a';
    }
    setTimeout(() => {
      if (searchBtn) {
        searchBtn.innerText = oldText;
        searchBtn.style.backgroundColor = '';
      }
      if (data.category) {
        location.href = 'comregister.html#' + data.category;
      } else {
        location.href = 'comregister.html#other';
      }
    }, 600);
  })
  .catch(err => {
    console.warn('AI search classification failed, using keyword fallback:', err);
    if (searchBtn) {
      searchBtn.innerText = '✓ Success';
      searchBtn.style.backgroundColor = '#16a34a';
    }
    setTimeout(() => {
      if (searchBtn) {
        searchBtn.innerText = oldText;
        searchBtn.style.backgroundColor = '';
      }
      const q = query.toLowerCase();
      if (q.includes('road') || q.includes('pothole') || q.includes('street') || q.includes('garbage') || q.includes('streetlight') || q.includes('highway') || q.includes('drainage')) {
        location.href = 'comregister.html#civic';
      } else if (q.includes('ration') || q.includes('food') || q.includes('canteen') || q.includes('water') || q.includes('meal') || q.includes('welfare') || q.includes('rice') || q.includes('wheat') || q.includes('grains')) {
        location.href = 'comregister.html#food';
      } else if (q.includes('school') || q.includes('education') || q.includes('college') || q.includes('scholarship') || q.includes('teacher') || q.includes('fee')) {
        location.href = 'comregister.html#education';
      } else if (q.includes('hospital') || q.includes('doctor') || q.includes('medicine') || q.includes('health') || q.includes('ambulance') || q.includes('clinic')) {
        location.href = 'comregister.html#health';
      } else {
        location.href = 'comregister.html#other';
      }
    }, 600);
  });
}

window.triggerSearch = triggerAISearch;

function initGlobalSearchHooks() {
  const searchInput = document.querySelector('header.header .search input');
  const searchBtn = document.querySelector('header.header .search button');
  if (searchInput && searchBtn) {
    searchInput.id = 'search-input';
    const newInput = searchInput.cloneNode(true);
    const newBtn = searchBtn.cloneNode(true);
    
    searchInput.parentNode.replaceChild(newInput, searchInput);
    searchBtn.parentNode.replaceChild(newBtn, searchBtn);
    
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerAISearch(newInput.value);
      }
    });
    newBtn.type = 'button';
    newBtn.addEventListener('click', () => {
      triggerAISearch(newInput.value);
    });
  }
}

// Open System Modals for Notifications and Settings
function openSystemModal(tab) {
  let modal = document.getElementById('system-panel-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'system-panel-overlay';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  let title = tab === 'notifications' ? '🔔 Citizen Notifications' : '⚙️ Portal Settings';
  let bodyContent = '';

  if (tab === 'notifications') {
    bodyContent = `
      <div style="display:flex; flex-direction:column; gap:12px; max-height:280px; overflow-y:auto; margin-bottom:20px;">
        <div style="padding:12px; background:#f0fdf4; border-left:4px solid #16a34a; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight:700; font-size:13px; color:#14532d; display:flex; justify-content:space-between;">
            <span>Complaint Resolved</span>
            <span style="font-size:11px; color:#64748b;">Just Now</span>
          </div>
          <p style="margin:4px 0 0; font-size:12px; color:#166534; line-height:1.4;">Your complaint regarding 'Water logging on Sector 4' has been resolved by Municipal Officer.</p>
        </div>
        <div style="padding:12px; background:#eff6ff; border-left:4px solid #2563eb; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight:700; font-size:13px; color:#1e3a8a; display:flex; justify-content:space-between;">
            <span>Officer Assigned</span>
            <span style="font-size:11px; color:#64748b;">2 hours ago</span>
          </div>
          <p style="margin:4px 0 0; font-size:12px; color:#1e40af; line-height:1.4;">Nodal Officer has been successfully assigned to track your grievance PM-2026-X80703.</p>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="closeSystemModal()" style="width:100%; justify-content:center;">Clear & Close</button>
    `;
  } else {
    bodyContent = `
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px; font-size:13px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:#334155;">Sound Alerts on Action</span>
          <input type="checkbox" checked style="width:18px; height:18px; accent-color:#1f7a3f;">
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:#334155;">Enable GPS Auto-Tracking</span>
          <input type="checkbox" checked style="width:18px; height:18px; accent-color:#1f7a3f;">
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:#334155;">Preferred Language</span>
          <select style="padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1; outline:none; background:#fff;">
            <option>English</option>
            <option>Hindi</option>
            <option>Telugu</option>
          </select>
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" onclick="closeSystemModal()" style="flex:1; justify-content:center;">Cancel</button>
        <button class="btn btn-primary" onclick="closeSystemModal(); alert('Settings saved successfully!');" style="flex:1; justify-content:center; background:#1f7a3f; border-color:#1f7a3f;">Save Settings</button>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal-card" style="max-width:440px; padding:26px; text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">
        <h3 style="margin:0; font-size:18px; font-weight:800; color:#0f172a;">${title}</h3>
        <button type="button" onclick="closeSystemModal()" style="border:none; background:none; font-size:24px; cursor:pointer; color:#64748b; line-height:1;">×</button>
      </div>
      <div>
        ${bodyContent}
      </div>
    </div>
  `;
  modal.classList.add('active');
}

function closeSystemModal() {
  const modal = document.getElementById('system-panel-overlay');
  if (modal) modal.classList.remove('active');
}

