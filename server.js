const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'prajamitra_secure_token_secret_key_2026';

app.use(cors());
app.use(express.json());

// Serve frontend files directly from the current directory
app.use(express.static(__dirname));

// Ensure directories exist
const DB_FILE = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploads as static resources
app.use('/uploads', express.static(UPLOADS_DIR));

// Database initialization helper
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initData = { users: [], complaints: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2));
    return initData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: [], complaints: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware for JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ==========================================================================
// AUTHENTICATION APIS
// ==========================================================================

// Register User
app.post('/api/auth/register', (req, res) => {
  const { email, phone, password } = req.body;
  if (!email || !phone || !password) {
    return res.status(400).json({ error: 'Email, phone, and password are required' });
  }

  const db = readDB();
  const userExists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);
  
  if (userExists) {
    return res.status(400).json({ error: 'User with this email or phone already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: 'USR-' + Date.now(),
    email: email.toLowerCase(),
    phone: phone,
    passwordHash: hashedPassword
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ message: 'User registered successfully!' });
});

// Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token: token,
    user: {
      email: user.email,
      phone: user.phone
    }
  });
});

// ==========================================================================
// COMPLAINTS APIS
// ==========================================================================

// Register a New Complaint
app.post('/api/complaints', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  const { 
    category, subcategory, title, description, severity, 
    latitude, longitude, anonymous, name, phone, email 
  } = req.body;

  if (!category || !title) {
    return res.status(400).json({ error: 'Category and Title are required fields' });
  }

  const db = readDB();
  
  // Generate Ticket ID
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const ticketId = `PM-2026-X${randomNum}`;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const etaDate = new Date();
  etaDate.setDate(today.getDate() + 7);
  const etaStr = etaDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const depts = {
    food: 'Civil Supplies & Consumer Affairs',
    civic: 'Municipal Administration & Urban Development',
    education: 'School Education Department',
    health: 'Health, Medical & Family Welfare',
    other: 'General Administration & Public Grievance'
  };
  const deptName = depts[category] || 'Concerned Public Authority';

  // Gather uploaded files paths
  const media = {};
  if (req.files) {
    if (req.files['photo']) media.photo = '/uploads/' + req.files['photo'][0].filename;
    if (req.files['video']) media.video = '/uploads/' + req.files['video'][0].filename;
    if (req.files['audio']) media.audio = '/uploads/' + req.files['audio'][0].filename;
  }

  const newComplaint = {
    id: ticketId,
    category: category,
    subcategory: subcategory || 'General',
    title: title,
    severity: severity || 'Medium',
    description: description || 'No detailed description provided.',
    location: {
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    },
    media: media,
    anonymous: anonymous === 'true',
    reporter: anonymous === 'true' ? null : {
      name: name || 'Anonymous Citizen',
      phone: phone || '',
      email: email || ''
    },
    date: `${dateStr} at ${timeStr}`,
    eta: etaStr,
    dept: deptName,
    status: 'Submitted (Under Review)',
    timeline: [
      { status: 'Submitted', desc: 'Complaint registered successfully.', date: `${dateStr} at ${timeStr}`, completed: true },
      { status: 'Assigned', desc: `Routed automatically to ${deptName} nodal officer.`, date: `${dateStr} at ${timeStr}`, completed: true },
      { status: 'Under Investigation', desc: 'Local field officer scheduled for inspection.', date: 'Pending inspector assign', completed: false },
      { status: 'Resolved', desc: 'Final site verification and resolution.', date: 'Pending action', completed: false }
    ]
  };

  db.complaints.unshift(newComplaint);
  writeDB(db);

  res.status(201).json(newComplaint);
});

// Track Complaint by ID
app.get('/api/complaints/track/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const found = db.complaints.find(c => c.id.toLowerCase() === id.toLowerCase());
  
  if (!found) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  res.json(found);
});

// Get authenticated user's complaint list
app.get('/api/complaints/user-history', authenticateToken, (req, res) => {
  const db = readDB();
  const userEmail = req.user.email.toLowerCase();
  
  // Filter complaints that match user's email (if not anonymous)
  const history = db.complaints.filter(c => {
    return !c.anonymous && c.reporter && c.reporter.email.toLowerCase() === userEmail;
  });
  
  res.json(history);
});

// Auto-suggestions search
app.get('/api/complaints/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  if (!query) return res.json([]);
  
  // List of keywords and their corresponding categories/redirections
  const keywordMappings = [
    { keywords: ['road', 'pothole', 'street', 'drainage', 'garbage', 'streetlight', 'highway', 'civic'], page: 'comregister.html#civic' },
    { keywords: ['ration', 'food', 'canteen', 'water', 'meal', 'welfare'], page: 'comregister.html#food' },
    { keywords: ['school', 'education', 'college', 'hostel', 'scholarship', 'teacher', 'fee'], page: 'comregister.html#education' },
    { keywords: ['hospital', 'doctor', 'medicine', 'health', 'ambulance', 'clinic'], page: 'comregister.html#health' },
    { keywords: ['police', 'transit', 'internet', 'noise', 'telecom', 'other', 'safety'], page: 'comregister.html#other' }
  ];

  // Filter maps to see if user input matches keywords
  const matches = [];
  keywordMappings.forEach(mapping => {
    const matchedKeyword = mapping.keywords.find(key => key.includes(query) || query.includes(key));
    if (matchedKeyword) {
      matches.push({
        title: `Report ${matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1)} Grievance`,
        url: mapping.page
      });
    }
  });

  res.json(matches.slice(0, 5));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`PrajaMitra Full-Stack server running at http://localhost:${PORT}`);
});
