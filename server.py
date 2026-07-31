import os
import json
import uuid
import hashlib
import mimetypes
import urllib.parse
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timedelta

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    os.environ[k] = v

load_env()

PORT = int(os.environ.get('PORT', 3000))
DB_FILE = os.path.join(os.path.dirname(__file__), 'database.json')
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), 'uploads')

# Ensure directories exist
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR, exist_ok=True)

# In-memory sessions store (Token -> User Email)
ACTIVE_SESSIONS = {}
AUTHORITY_ROLES = {}

# Database helper functions
def read_db():
    if not os.path.exists(DB_FILE):
        init_data = {"users": [], "complaints": [], "departments": []}
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(init_data, f, indent=2)
        return init_data
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            db = json.load(f)
            if 'departments' not in db:
                db['departments'] = [
                    {"id": "DEP-1", "name": "Food Department", "type": "Food", "email": "food.dept@gov.in", "phone": "1800-111-222", "status": "Active"},
                    {"id": "DEP-2", "name": "Civic Infrastructure", "type": "Civic", "email": "civic.dept@gov.in", "phone": "1800-333-444", "status": "Active"},
                    {"id": "DEP-3", "name": "Education Department", "type": "Education", "email": "edu.dept@gov.in", "phone": "1800-555-666", "status": "Active"},
                    {"id": "DEP-4", "name": "Health Department", "type": "Health", "email": "health.dept@gov.in", "phone": "1800-777-888", "status": "Active"}
                ]
                with open(DB_FILE, 'w', encoding='utf-8') as fw:
                    json.dump(db, fw, indent=2)
            return db
    except Exception:
        return {"users": [], "complaints": [], "departments": []}

def write_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# Custom multipart form parser for Python 3.13 (no cgi)
def parse_multipart(body_bytes, boundary):
    boundary_bytes = b'--' + boundary.encode('utf-8')
    parts = body_bytes.split(boundary_bytes)
    data = {}
    files = {}
    
    for part in parts:
        if not part or part == b'--\r\n' or part == b'--' or part == b'\r\n' or part == b'\r\n--\r\n':
            continue
        
        # Split headers and content
        if b'\r\n\r\n' in part:
            header_part, content = part.split(b'\r\n\r\n', 1)
        else:
            continue
        
        # Remove leading/trailing line endings from content
        if header_part.startswith(b'\r\n'):
            header_part = header_part[2:]
        if content.endswith(b'\r\n'):
            content = content[:-2]
        if content.endswith(b'\r\n--'):
            content = content[:-4]
            
        header_text = header_part.decode('utf-8', errors='ignore')
        
        # Parse Content-Disposition
        name = None
        filename = None
        for line in header_text.split('\r\n'):
            if line.lower().startswith('content-disposition:'):
                disposition_parts = line.split(';')
                for dp in disposition_parts:
                    dp = dp.strip()
                    if dp.startswith('name='):
                        name = dp.split('=')[1].strip('"')
                    elif dp.startswith('filename='):
                        filename = dp.split('=')[1].strip('"')
                        
        if name:
            if filename:
                files[name] = {
                    'filename': filename,
                    'content': content
                }
            else:
                data[name] = content.decode('utf-8', errors='ignore').strip()
                
    return data, files

# Handler for HTTP requests
class PrajaMitraHandler(BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        # Override to log cleanly
        super().log_message(format, *args)
        
    def do_OPTIONS(self):
        # CORS preflight response
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
        
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
    def get_auth_user(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            return ACTIVE_SESSIONS.get(token)
        return None

    # GET requests routing
    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path
        query = urllib.parse.parse_qs(url_parts.query)

        # 1. API Endpoint Routing
        # Search Autocomplete
        if path == '/api/complaints/search':
            self.handle_search_suggestions(query)
            return
            
        # Track Complaint by ID
        elif path.startswith('/api/complaints/track/'):
            ticket_id = path.split('/')[-1]
            self.handle_track_complaint(ticket_id)
            return
            
        # User Grievance History
        elif path == '/api/complaints/user-history':
            self.handle_user_history(query)
            return

        # Complaint Statistics
        elif path == '/api/complaints/stats':
            self.handle_stats()
            return

        # Authority Dashboard Metrics
        elif path == '/api/authority/metrics':
          self.handle_authority_metrics()
          return

        # Authority Analytics Trend Data
        elif path == '/api/authority/analytics':
          self.handle_authority_analytics()
          return

        # Fetch Departments
        elif path == '/api/departments':
          self.handle_get_departments()
          return

        # Fetch Users
        elif path == '/api/users':
          self.handle_get_users()
          return

        # 2. Static Files Server
        if path == '/' or path == '':
            path = '/index.html'
            
        file_path = os.path.join(os.path.dirname(__file__), path.lstrip('/'))
        
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            self.send_response(200)
            self.send_cors_headers()
            
            # Set content types
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                if file_path.endswith('.css'):
                    content_type = 'text/css'
                elif file_path.endswith('.js'):
                    content_type = 'text/javascript'
                else:
                    content_type = 'application/octet-stream'
                    
            self.send_header('Content-Type', content_type)
            self.end_headers()
            
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404, 'File Not Found')

    # POST requests routing
    def do_POST(self):
        path = self.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)

        # A. Register User Account
        if path == '/api/auth/register':
            self.handle_register(body_bytes)
            
        # B. User Login Auth
        elif path == '/api/auth/login':
            self.handle_login(body_bytes)
            
        # C. Submit Complaint Grievance
        elif path == '/api/complaints':
            self.handle_submit_complaint(body_bytes)
            
        # D. AI Auto-Generate Title & Description
        elif path == '/api/ai/generate':
            self.handle_ai_generate(body_bytes)

        # E. AI Search Classification
        elif path == '/api/ai/classify-search':
            self.handle_ai_search_classify(body_bytes)

        # F. Google Auth Login
        elif path == '/api/auth/google':
            self.handle_google_login(body_bytes)

        # G. Update Complaint Status (Authority Action)
        elif path == '/api/complaints/update-status':
            self.handle_update_status(body_bytes)

        # H. Authority Login with Passcode
        elif path == '/api/auth/authority':
            self.handle_authority_login(body_bytes)

        # I. Create Department
        elif path == '/api/departments':
            self.handle_create_department(body_bytes)

        # J. Delete Department
        elif path == '/api/departments/delete':
            self.handle_delete_department(body_bytes)

        # K. Delete User
        elif path == '/api/users/delete':
            self.handle_delete_user(body_bytes)

        # K2. Update User Role
        elif path == '/api/users/update-role':
            self.handle_update_user_role(body_bytes)

        # K3. Update User Department
        elif path == '/api/users/update-department':
            self.handle_update_user_department(body_bytes)

        # L. Update Passkeys
        elif path == '/api/settings/update-passkey':
            self.handle_update_passkey(body_bytes)

        # M. Broadcast Notification
        elif path == '/api/notifications/broadcast':
            self.handle_broadcast_notification(body_bytes)
            
        else:
            self.send_error(404, 'API Endpoint Not Found')

    # ==========================================================================
    # API HANDLER IMPLEMENTATIONS
    # ==========================================================================

    def handle_ai_generate(self, body_bytes):
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        category = req_data.get('category')
        subcategory = req_data.get('subcategory')
        custom_sub_text = req_data.get('customSubText', '')
        
        if not category or not subcategory:
            self.send_json_response(400, {"error": "Category and subcategory are required"})
            return
            
        # 1. Check if Gemini API Key is available
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            prompt = (
                f"You are an AI assistant for a citizen grievance portal called PrajaMitra.\n"
                f"Generate a professional, concise title and a realistic, detailed description "
                f"for a public complaint in India based on the following input:\n"
                f"Category: {category}\n"
                f"Subcategory: {subcategory}\n"
            )
            if custom_sub_text:
                prompt += f"Specific problem details: {custom_sub_text}\n"
                
            prompt += (
                f"\nReturn ONLY a valid JSON object containing exactly the keys 'title' and 'description'.\n"
                f"Do not include any markdown format (like ```json), styling, backticks, or extra text.\n"
                f"Example output:\n"
                f'{{"title": "Potholes on Main Road", "description": "There are deep potholes causing traffic..."}}'
            )
            
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                post_data = {
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }]
                }
                
                req = urllib.request.Request(
                    url,
                    data=json.dumps(post_data).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                
                # Using standard library urllib.request to fetch Gemini API response
                with urllib.request.urlopen(req, timeout=8) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    text_out = res_body['candidates'][0]['content']['parts'][0]['text'].strip()
                    
                    if text_out.startswith("```json"):
                        text_out = text_out[7:]
                    if text_out.startswith("```"):
                        text_out = text_out[3:]
                    if text_out.endswith("```"):
                        text_out = text_out[:-3]
                    text_out = text_out.strip()
                    
                    ai_data = json.loads(text_out)
                    if 'title' in ai_data and 'description' in ai_data:
                        self.send_json_response(200, ai_data)
                        return
            except Exception as e:
                print(f"Gemini API generation failed, using mock fallback: {e}")
                
        # 2. Fallback Mock Predictions
        mock_predictions = {
            "food": {
                "Ration Shop Delay": {
                    "title": "Delay in Ration Card Distribution & Monthly Grain Supply",
                    "description": "I am raising this complaint to report that the local fair price shop has not distributed the monthly rations for the last 15 days, causing severe hardship to all cardholders in our locality."
                },
                "Food Quality Issue": {
                    "title": "Substandard Quality of Grains Distributed at Public Depot",
                    "description": "The quality of wheat and rice distributed at the fair price shop is extremely poor and contains sand particles and insects. It is unfit for human consumption."
                },
                "Drinking Water Supply": {
                    "title": "Irregular and Contaminated Municipal Drinking Water Supply",
                    "description": "Drinking water is supplied only once a week, and it comes out muddy with a foul smell. Requesting urgent cleaning of the local reservoir."
                },
                "Mid-day Meal Delay": {
                    "title": "Disruption in Mid-day Meal Scheme in Local School",
                    "description": "The mid-day meal scheme has been non-functional for the past week in the local municipal school due to raw material shortages. Children are not receiving their lunch."
                },
                "Welfare Scheme Issue": {
                    "title": "Delay in Disbursement of Public Welfare Pension Benefits",
                    "description": "The monthly welfare pension scheme amount has not been credited to the beneficiaries' bank accounts for three consecutive months. Urgent verification needed."
                }
            },
            "civic": {
                "Road Pothole": {
                    "title": "Major Potholes on Main Crossing Causing Frequent Accidents",
                    "description": "The main road is filled with huge potholes that fill up during rains, causing traffic blocks and minor motor accidents every day. Needs immediate resurfacing."
                },
                "Drainage Leakage": {
                    "title": "Overflown Sewage Lines Causing Dirty Water Accumulation",
                    "description": "The sewage line has blocked and dirty black water is leaking out onto the footpath, causing a terrible odor and creating health hazards for residents."
                },
                "Garbage Accumulation": {
                    "title": "Unattended Garbage Dump Piling Up in Residential Street",
                    "description": "The municipal garbage truck has not cleared the garbage bin at this corner for over 10 days. The waste is overflowing and spreading onto the street."
                },
                "Streetlight Malfunction": {
                    "title": "Non-functional Streetlights Creating Dark Safety Hazards",
                    "description": "All streetlights from building 4 to building 10 have been out of order for the last two weeks, making it extremely unsafe for women and children at night."
                },
                "Traffic Congestion": {
                    "title": "Chaotic Traffic Congestion and Lack of Signals at Crossroad",
                    "description": "Traffic jams are lasting for hours at the main junction due to broken signals and lack of traffic police monitoring during peak office hours."
                }
            },
            "education": {
                "School Infrastructure": {
                    "title": "Dilapidated Classroom Roofs and Lack of Benches in Govt School",
                    "description": "The classroom roofs are leaking water during rains, and pupils have to sit on the floor due to broken benches. Urgent repairs required."
                },
                "Scholarship Delay": {
                    "title": "Unreasonable Delay in Granting Annual Scholarship Funds",
                    "description": "The state higher education scholarship funds have not been disbursed for the current academic session, causing financial distress to eligible candidates."
                },
                "Hostel Facilities": {
                    "title": "Unhygienic Toilets and Lack of Proper Food in Govt Hostel",
                    "description": "The boy's/girl's hostel is in a state of neglect with unusable toilets and poorly cooked, unhygienic meals served in the mess."
                },
                "Teacher Shortage": {
                    "title": "Severe Shortage of Teaching Staff in Primary Classes",
                    "description": "There are only 2 teachers available for 5 primary classes in the school. The curriculum is severely lagging due to staffing shortages."
                },
                "Fee Issue": {
                    "title": "Arbitrary Fee Increase by Private Management Against Norms",
                    "description": "The local school administration has suddenly increased the tuition fee by 30% without proper authorization, which is a direct violation of state regulations."
                }
            },
            "health": {
                "Doctor Absence": {
                    "title": "Lack of Attending Doctors at Primary Health Center Clinic",
                    "description": "Patients are waiting in long queues since morning, but no medical officers or attending doctors have arrived at the local health clinic."
                },
                "Medicine Shortage": {
                    "title": "Shortage of Essential Lifesaving Medicines at Health Depot",
                    "description": "Patients are forced to buy basic medicines from private pharmacies because the government health center has been out of stock for weeks."
                },
                "Sanitation Issue": {
                    "title": "Unhygienic Conditions and Garbage Dumps in Local Clinic Area",
                    "description": "Medical waste and plastic wrap are dumped in open areas behind the clinic ward, posing a high risk of hospital-acquired infections."
                },
                "Ambulance Delay": {
                    "title": "Delayed Ambulance Emergency Response Services",
                    "description": "The emergency ambulance services took more than an hour to respond to a critical heart attack call in the block, highlighting severe neglect."
                },
                "Hospital Hygiene": {
                    "title": "Extremely Dirty Beds and Inadequate Cleaning in General Ward",
                    "description": "The hospital beds are not changed, and dust/grime has accumulated in the wards. Sweepers are not clearing waste bins regularly."
                }
            },
            "other": {
                "Police Inaction": {
                    "title": "Delay in Registering Police Report (FIR) for Wallet Theft",
                    "description": "The local police desk has refused to register an FIR for my stolen wallet and mobile, asking me to wait indefinitely without reason."
                },
                "Telecommunications": {
                    "title": "Frequent Telecom Network Outages and Poor Connectivity",
                    "description": "The mobile phone network towers are frequently down in our village block, causing severe disruptions to daily communication and online studies."
                },
                "Transport Issues": {
                    "title": "Irregular State Bus Service timings on Route 45B",
                    "description": "The scheduled state buses are frequently skipping their runs, leaving daily commuters and students stranded for hours on the main stops."
                },
                "General Inquiry": {
                    "title": "General Grievance: Delay in Processing Citizen Certificates",
                    "description": "My application for local resident certificate has been stuck in 'pending' status for more than 45 days at the municipal office."
                },
                "Other Grievance": {
                    "title": "General Grievance Query",
                    "description": "I am submitting this grievance to request assistance on a custom issue that needs review and escalation."
                }
            }
        }
        
        sub_key = subcategory
        if sub_key == 'Others' and custom_sub_text:
            title = f"{custom_sub_text} Grievance"
            description = f"This complaint is raised to report: {custom_sub_text}. Requesting immediate inspection, action, and resolution by the concerned department."
        else:
            cat_preds = mock_predictions.get(category, mock_predictions['other'])
            match = cat_preds.get(sub_key)
            if match:
                title = match['title']
                description = match['description']
            else:
                title = f"{subcategory} Grievance"
                description = f"I am facing an issue regarding {subcategory}. Please look into this matter and resolve it at the earliest."
                
        self.send_json_response(200, {"title": title, "description": description})

    def handle_stats(self):
        db = read_db()
        complaints = db.get('complaints', [])
        total = len(complaints)
        investigation = 0
        resolved = 0
        for c in complaints:
            status = c.get('status', '').lower()
            if 'resolved' in status:
                resolved += 1
            else:
                investigation += 1
        
        self.send_json_response(200, {
            "total": total,
            "investigation": investigation,
            "resolved": resolved
        })

    def handle_ai_search_classify(self, body_bytes):
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        query = req_data.get('query', '').strip()
        if not query:
            self.send_json_response(200, {"category": "other"})
            return
            
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            prompt = (
                f"Classify this search query into one of these grievance categories:\n"
                f"- 'food' (for ration card, food quality, rice, wheat, grains, canteens, water, public distribution, hunger)\n"
                f"- 'civic' (for roads, potholes, garbage, street lights, drainage, traffic, infrastructure, sewage, public layout)\n"
                f"- 'education' (for schools, colleges, scholarship, teachers, hostel, fees, student)\n"
                f"- 'health' (for hospitals, clinics, doctor, medicine, ambulance, hygiene, sanitation, hospital ward)\n"
                f"- 'other' (for any other issue like police, telecom, transport, fire, general inquiry)\n\n"
                f"Query: \"{query}\"\n\n"
                f"Return ONLY a JSON object containing the key 'category' with one of the values: 'food', 'civic', 'education', 'health', 'other'. Do not include markdown code block formatting."
            )
            
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                post_data = {
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }]
                }
                
                req = urllib.request.Request(
                    url,
                    data=json.dumps(post_data).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                
                with urllib.request.urlopen(req, timeout=5) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    text_out = res_body['candidates'][0]['content']['parts'][0]['text'].strip()
                    
                    if text_out.startswith("```json"):
                        text_out = text_out[7:]
                    if text_out.startswith("```"):
                        text_out = text_out[3:]
                    if text_out.endswith("```"):
                        text_out = text_out[:-3]
                    text_out = text_out.strip()
                    
                    ai_data = json.loads(text_out)
                    if 'category' in ai_data:
                        self.send_json_response(200, {"category": ai_data['category']})
                        return
            except Exception as e:
                print(f"Gemini search classification failed, using keyword fallback: {e}")
                
        # Keyword Fallback Matching
        q = query.lower()
        category = 'other'
        if any(x in q for x in ['hospital', 'doctor', 'medicine', 'health', 'ambulance', 'clinic', 'hygiene', 'ward', 'nurse']):
            category = 'health'
        elif any(x in q for x in ['school', 'education', 'college', 'scholarship', 'teacher', 'fee', 'hostel', 'student']):
            category = 'education'
        elif any(x in q for x in ['road', 'pothole', 'street', 'drainage', 'garbage', 'streetlight', 'highway', 'civic', 'sewage', 'traffic', 'leak']):
            category = 'civic'
        elif any(x in q for x in ['rice', 'wheat', 'grain', 'ration', 'food', 'canteen', 'water', 'meal', 'welfare', 'hungry', 'pds']):
            category = 'food'
            
        self.send_json_response(200, {"category": category})

    def handle_register(self, body_bytes):
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        email = req_data.get('email')
        phone = req_data.get('phone')
        password = req_data.get('password')
        
        if not email or not phone or not password:
            self.send_json_response(400, {"error": "Email, Phone, and Password are required"})
            return
            
        db = read_db()
        for u in db['users']:
            if u['email'].lower() == email.lower() or u['phone'] == phone:
                self.send_json_response(400, {"error": "User with this email or phone already exists"})
                return
                
        password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        new_user = {
            "id": "USR-" + str(int(datetime.now().timestamp() * 1000)),
            "email": email.lower(),
            "phone": phone,
            "passwordHash": password_hash
        }
        
        db['users'].append(new_user)
        write_db(db)
        self.send_json_response(201, {"message": "User registered successfully!"})

    def handle_login(self, body_bytes):
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        email = req_data.get('email')
        password = req_data.get('password')
        
        if not email or not password:
            self.send_json_response(400, {"error": "Email and password are required"})
            return
            
        db = read_db()
        password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        user = None
        for u in db['users']:
            if u['email'].lower() == email.lower() and u['passwordHash'] == password_hash:
                user = u
                break
                
        if not user:
            self.send_json_response(401, {"error": "Invalid email or password"})
            return
            
        # Generate session token
        token = uuid.uuid4().hex
        ACTIVE_SESSIONS[token] = user['email']
        
        self.send_json_response(200, {
            "token": token,
            "user": {
                "email": user['email'],
                "phone": user['phone']
            }
        })

    def handle_submit_complaint(self, body_bytes):
        content_type = self.headers.get('Content-Type', '')
        boundary = None
        if 'boundary=' in content_type:
            boundary = content_type.split('boundary=')[1].strip()
            
        if not boundary:
            self.send_json_response(400, {"error": "Content-Type must be multipart with boundary"})
            return
            
        fields, files = parse_multipart(body_bytes, boundary)
        
        category = fields.get('category')
        subcategory = fields.get('subcategory')
        title = fields.get('title')
        description = fields.get('description', '')
        severity = fields.get('severity', 'Medium')
        latitude = fields.get('latitude')
        longitude = fields.get('longitude')
        anonymous = fields.get('anonymous') == 'true'
        name = fields.get('name', 'Anonymous Citizen')
        phone = fields.get('phone', '')
        email = fields.get('email', '')

        if not category or not title:
            self.send_json_response(400, {"error": "Category and Title are required fields"})
            return

        # Write uploaded files
        media = {}
        for file_key in ['photo', 'video', 'audio']:
            if file_key in files:
                f_data = files[file_key]
                unique_name = f"{file_key}-{uuid.uuid4().hex}{os.path.splitext(f_data['filename'])[1]}"
                f_path = os.path.join(UPLOADS_DIR, unique_name)
                with open(f_path, 'wb') as f:
                    f.write(f_data['content'])
                media[file_key] = '/uploads/' + unique_name

        random_num = str(int(uuid.uuid4().int % 90000) + 10000)
        ticket_id = f"PM-2026-X{random_num}"
        
        today = datetime.now()
        date_str = today.strftime('%d %b %Y')
        time_str = today.strftime('%I:%M %p')
        
        eta_date = today + timedelta(days=7)
        eta_str = eta_date.strftime('%d %b %Y')

        depts = {
            'food': 'Civil Supplies & Consumer Affairs',
            'civic': 'Municipal Administration & Urban Development',
            'education': 'School Education Department',
            'health': 'Health, Medical & Family Welfare',
            'other': 'General Administration & Public Grievance'
        }
        dept_name = depts.get(category, 'Concerned Public Authority')

        new_complaint = {
            "id": ticket_id,
            "category": category,
            "subcategory": subcategory or "General",
            "title": title,
            "severity": severity,
            "description": description or "No detailed description provided.",
            "location": {
                "latitude": float(latitude) if latitude else None,
                "longitude": float(longitude) if longitude else None
            },
            "media": media,
            "anonymous": anonymous,
            "reporter": None if anonymous else {
                "name": name,
                "phone": phone,
                "email": email
            },
            "date": f"{date_str} at {time_str}",
            "eta": eta_str,
            "dept": dept_name,
            "status": "Submitted (Under Review)",
            "timeline": [
                {"status": "Submitted", "desc": "Complaint registered successfully.", "date": f"{date_str} at {time_str}", "completed": True},
                {"status": "Assigned", "desc": f"Routed automatically to {dept_name} nodal officer.", "date": f"{date_str} at {time_str}", "completed": True},
                {"status": "Under Investigation", "desc": "Local field officer scheduled for inspection.", "date": "Pending inspector assign", "completed": False},
                {"status": "Resolved", "desc": "Final site verification and resolution.", "date": "Pending action", "completed": False}
            ]
        }

        db = read_db()
        db['complaints'].insert(0, new_complaint)
        write_db(db)
        
        self.send_json_response(201, new_complaint)

    def handle_track_complaint(self, ticket_id):
        db = read_db()
        found = None
        for c in db['complaints']:
            if c['id'].lower() == ticket_id.lower():
                found = c
                break
                
        if not found:
            self.send_json_response(404, {"error": "Complaint not found"})
        else:
            self.send_json_response(200, found)

    def handle_user_history(self, query_params):
        user_email = self.get_auth_user()
        if not user_email:
            self.send_json_response(401, {"error": "Access token is missing or invalid"})
            return
            
        db = read_db()
        email_lower = user_email.lower()
        
        # Check if user is logged in as an authority
        is_authority = email_lower in AUTHORITY_ROLES
        
        history = []
        if is_authority:
            assigned_cat = AUTHORITY_ROLES[email_lower]
            show_all = query_params.get('all', [''])[0].lower() == 'true'
            for c in db['complaints']:
                # Filter by assigned category or return all if all=true is passed
                # Labeled filter also includes 'other' category complaints for authorities
                if show_all or c.get('category') == assigned_cat or c.get('category') == 'other':
                    history.append(c)
        else:
            for c in db['complaints']:
                if not c.get('anonymous') and c.get('reporter') and c['reporter'].get('email', '').lower() == email_lower:
                    history.append(c)
                    
        self.send_json_response(200, history)

    def handle_authority_login(self, body_bytes):
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        email = req_data.get('email', '').strip().lower()
        department = req_data.get('department', '').strip().lower()
        passcode = req_data.get('passcode', '').strip()
        
        if not email or not department or not passcode:
            self.send_json_response(400, {"error": "Email, Department, and Passcode are required"})
            return
            
        db = read_db()
        settings = db.get('settings', {})
        passkeys = settings.get('passkeys', {
            "food": "101",
            "education": "102",
            "civic": "103",
            "health": "104",
            "others": "100"
        })

        valid = False
        assigned_cat = 'other'
        if department == 'food' and passcode == passkeys.get('food', '101'):
            valid = True
            assigned_cat = 'food'
        elif department == 'education' and passcode == passkeys.get('education', '102'):
            valid = True
            assigned_cat = 'education'
        elif department == 'civic' and passcode == passkeys.get('civic', '103'):
            valid = True
            assigned_cat = 'civic'
        elif department == 'health' and passcode == passkeys.get('health', '104'):
            valid = True
            assigned_cat = 'health'
        elif department == 'others' and passcode == passkeys.get('others', '100'):
            valid = True
            assigned_cat = 'other'
            
        if not valid:
            self.send_json_response(401, {"error": "Invalid Department Passkey match"})
            return
            
        db = read_db()
        user = None
        for u in db['users']:
            if u['email'].lower() == email:
                user = u
                break
                
        if not user:
            user = {
                "id": "USR-" + str(int(datetime.now().timestamp() * 1000)),
                "email": email,
                "phone": "",
                "passwordHash": ""
            }
            db['users'].append(user)
            write_db(db)
            
        token = uuid.uuid4().hex
        ACTIVE_SESSIONS[token] = user['email']
        AUTHORITY_ROLES[user['email'].lower()] = assigned_cat
        
        self.send_json_response(200, {
            "token": token,
            "email": user['email']
        })

    def handle_google_login(self, body_bytes):
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        email = req_data.get('email', '').strip().lower()
        if not email:
            self.send_json_response(400, {"error": "Email is required"})
            return
            
        db = read_db()
        user = None
        for u in db['users']:
            if u['email'].lower() == email:
                user = u
                break
                
        if not user:
            # Register new user dynamically
            user = {
                "id": "USR-" + str(int(datetime.now().timestamp() * 1000)),
                "email": email,
                "phone": "",
                "passwordHash": ""
            }
            db['users'].append(user)
            write_db(db)
            
        token = uuid.uuid4().hex
        ACTIVE_SESSIONS[token] = user['email']
        
        self.send_json_response(200, {
            "token": token,
            "email": user['email']
        })

    def handle_update_status(self, body_bytes):
        # Verify user is an authority
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(403, {"error": "Only authority accounts can update complaint status"})
            return
            
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
            
        complaint_id = req_data.get('id')
        new_status = req_data.get('status')
        
        if not complaint_id or not new_status:
            self.send_json_response(400, {"error": "Complaint ID and status are required"})
            return
            
        db = read_db()
        found_idx = -1
        for idx, c in enumerate(db['complaints']):
            if c['id'].lower() == complaint_id.lower():
                found_idx = idx
                break
                
        if found_idx == -1:
            self.send_json_response(404, {"error": "Complaint not found"})
            return
            
        c = db['complaints'][found_idx]
        
        # Update main status text
        c['status'] = new_status
        
        # Determine current date & time string
        today = datetime.now()
        date_str = today.strftime('%d %b %Y')
        time_str = today.strftime('%I:%M %p')
        today_str = f"{date_str} at {time_str}"
        
        # Update matching timeline items to completed
        # Status mappings
        # Submitted -> index 0
        # Assigned -> index 1
        # Under Investigation -> index 2
        # Resolved -> index 3
        # Ensure all steps up to the chosen status are marked completed!
        if 'investigation' in new_status.lower():
            target_step = 'Under Investigation'
            steps_to_complete = ['Submitted', 'Assigned', 'Under Investigation']
        elif 'resolved' in new_status.lower():
            target_step = 'Resolved'
            steps_to_complete = ['Submitted', 'Assigned', 'Under Investigation', 'Resolved']
        else:
            target_step = 'Submitted'
            steps_to_complete = ['Submitted']
            
        for step in c.get('timeline', []):
            if step['status'] in steps_to_complete:
                step['completed'] = True
                if step['date'] == 'Pending inspector assign' or step['date'] == 'Pending action':
                    step['date'] = today_str
            else:
                step['completed'] = False
                
        db['complaints'][found_idx] = c
        write_db(db)
        self.send_json_response(200, c)

    def handle_search_suggestions(self, query):
        q = query.get('q', [''])[0].lower().strip()
        if not q:
            self.send_json_response(200, [])
            return
            
        keyword_mappings = [
            {"keywords": ['road', 'pothole', 'street', 'drainage', 'garbage', 'streetlight', 'highway', 'civic'], "page": 'comregister.html#civic'},
            {"keywords": ['ration', 'food', 'canteen', 'water', 'meal', 'welfare'], "page": 'comregister.html#food'},
            {"keywords": ['school', 'education', 'college', 'scholarship', 'teacher', 'fee'], "page": 'comregister.html#education'},
            {"keywords": ['hospital', 'doctor', 'medicine', 'health', 'ambulance', 'clinic'], "page": 'comregister.html#health'},
            {"keywords": ['police', 'transit', 'internet', 'noise', 'telecom', 'other', 'safety'], "page": 'comregister.html#other'}
        ]

        matches = []
        for mapping in keyword_mappings:
            for key in mapping['keywords']:
                if key in q or q in key:
                    matches.append({
                        "title": f"Report {key.capitalize()} Grievance",
                        "url": mapping['page']
                    })
                    break
                    
        self.send_json_response(200, matches[:5])

    def handle_authority_metrics(self):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return

        db = read_db()
        dept_count = len(db.get('departments', []))
        users_count = len(db.get('users', []))
        complaints = db.get('complaints', [])
        complaints_count = len(complaints)
        resolved_count = len([c for c in complaints if 'Resolved' in c.get('status', '')])

        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_counts = {m: 0 for m in months}
        
        for c in complaints:
            try:
                date_str = c.get('date', '')
                for m in months:
                    if m in date_str:
                        monthly_counts[m] += 1
                        break
            except Exception:
                pass

        status_counts = {"Submitted": 0, "Under Investigation": 0, "Resolved": 0}
        for c in complaints:
            status = c.get('status', '')
            if 'Submitted' in status or 'Review' in status or 'Assigned' in status:
                status_counts['Submitted'] += 1
            elif 'Investigation' in status:
                status_counts['Under Investigation'] += 1
            elif 'Resolved' in status:
                status_counts['Resolved'] += 1

        self.send_json_response(200, {
            "departments_count": dept_count,
            "users_count": users_count,
            "complaints_count": complaints_count,
            "resolved_count": resolved_count,
            "monthly_overview": monthly_counts,
            "status_distribution": status_counts
        })

    def handle_get_departments(self):
        db = read_db()
        self.send_json_response(200, db.get('departments', []))

    def handle_create_department(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return

        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return

        name = req_data.get('name', '').strip()
        dtype = req_data.get('type', '').strip()
        email = req_data.get('email', '').strip()
        phone = req_data.get('phone', '').strip()
        desc = req_data.get('desc', '').strip()
        status = req_data.get('status', 'Active').strip()

        if not name or not dtype or not email:
            self.send_json_response(400, {"error": "Name, type, and email are required"})
            return

        db = read_db()
        dept_id = "DEP-" + str(int(datetime.now().timestamp() * 1000))
        new_dept = {
            "id": dept_id,
            "name": name,
            "type": dtype,
            "email": email,
            "phone": phone,
            "description": desc,
            "status": status
        }
        db['departments'].append(new_dept)
        write_db(db)
        self.send_json_response(200, new_dept)

    def handle_delete_department(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return

        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return

        dept_id = req_data.get('id')
        if not dept_id:
            self.send_json_response(400, {"error": "Department ID is required"})
            return

        db = read_db()
        initial_len = len(db.get('departments', []))
        db['departments'] = [d for d in db.get('departments', []) if d.get('id') != dept_id]
        
        if len(db['departments']) == initial_len:
            self.send_json_response(404, {"error": "Department not found"})
            return

        write_db(db)
        self.send_json_response(200, {"success": True})

    def handle_get_users(self):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return

        db = read_db()
        users_list = []
        for u in db.get('users', []):
            users_list.append({
                "id": u.get('id'),
                "email": u.get('email'),
                "phone": u.get('phone', ''),
                "role": "Authority" if u.get('email', '').lower() in AUTHORITY_ROLES else "Citizen",
                "department": AUTHORITY_ROLES.get(u.get('email', '').lower(), "N/A").capitalize() if u.get('email', '').lower() in AUTHORITY_ROLES else "N/A",
                "status": "Active"
            })
        self.send_json_response(200, users_list)

    def handle_delete_user(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return

        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return

        user_id = req_data.get('id')
        if not user_id:
            self.send_json_response(400, {"error": "User ID is required"})
            return

        db = read_db()
        initial_len = len(db.get('users', []))
        db['users'] = [u for u in db.get('users', []) if u.get('id') != user_id]
        
        if len(db['users']) == initial_len:
            self.send_json_response(404, {"error": "User not found"})
            return

        write_db(db)
        self.send_json_response(200, {"success": True})

    def handle_update_user_role(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
        
        user_id = req_data.get('id')
        new_role = req_data.get('role')
        if not user_id or not new_role:
            self.send_json_response(400, {"error": "User ID and Role are required"})
            return
            
        db = read_db()
        updated = False
        for u in db.get('users', []):
            if u.get('id') == user_id:
                u['role'] = new_role
                if new_role == 'Authority':
                    email_low = u['email'].lower()
                    if email_low not in AUTHORITY_ROLES:
                        dept_cat = u.get('department', 'other').lower()
                        AUTHORITY_ROLES[email_low] = dept_cat if dept_cat != 'n/a' else 'other'
                updated = True
                break
                
        if not updated:
            self.send_json_response(404, {"error": "User not found"})
            return
            
        write_db(db)
        self.send_json_response(200, {"success": True})

    def handle_update_user_department(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
        
        user_id = req_data.get('id')
        new_dept = req_data.get('department')
        if not user_id or not new_dept:
            self.send_json_response(400, {"error": "User ID and Department are required"})
            return
            
        db = read_db()
        updated = False
        for u in db.get('users', []):
            if u.get('id') == user_id:
                u['department'] = new_dept
                if u.get('role') == 'Authority':
                    email_low = u['email'].lower()
                    dept_cat = new_dept.lower()
                    AUTHORITY_ROLES[email_low] = dept_cat if dept_cat != 'n/a' else 'other'
                updated = True
                break
                
        if not updated:
            self.send_json_response(404, {"error": "User not found"})
            return
            
        write_db(db)
        self.send_json_response(200, {"success": True})

    def handle_authority_analytics(self):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return
        
        db = read_db()
        complaints = db.get('complaints', [])
        
        averages = {
            "food": {"total_days": 0, "count": 0, "default": 3.4},
            "education": {"total_days": 0, "count": 0, "default": 5.1},
            "civic": {"total_days": 0, "count": 0, "default": 7.2},
            "health": {"total_days": 0, "count": 0, "default": 2.8},
            "other": {"total_days": 0, "count": 0, "default": 4.5}
        }
        
        category_monthly = {
            "food": [12, 19, 15, 8, 14, 24, 18, 15, 10, 12, 16, 20],
            "education": [8, 12, 11, 14, 9, 15, 21, 14, 12, 10, 15, 18],
            "civic": [20, 24, 30, 28, 22, 35, 42, 30, 25, 28, 32, 40],
            "health": [5, 9, 8, 4, 7, 12, 16, 10, 9, 8, 11, 14],
            "other": [6, 8, 10, 5, 8, 11, 15, 12, 8, 7, 10, 12]
        }
        
        res_data = {}
        for cat in averages:
            resolved_list = [c for c in complaints if c.get('category') == cat and 'Resolved' in c.get('status', '')]
            total_grievances = len([c for c in complaints if c.get('category') == cat])
            resolved_count = len(resolved_list)
            
            avg_days = averages[cat]['default']
            if resolved_count > 0:
                avg_days = round(5.2 / resolved_count, 1)
            
            res_data[cat] = {
                "category": cat.capitalize(),
                "average_days": avg_days,
                "total_cases": total_grievances,
                "resolved_cases": resolved_count,
                "trend": category_monthly[cat]
            }
            
        self.send_json_response(200, res_data)

    def handle_update_passkey(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
        
        dept = req_data.get('department')
        new_key = req_data.get('passkey')
        
        if not dept or not new_key:
            self.send_json_response(400, {"error": "Department and new Passkey are required"})
            return
            
        db = read_db()
        if 'settings' not in db:
            db['settings'] = {}
        if 'passkeys' not in db['settings']:
            db['settings']['passkeys'] = {
                "food": "101",
                "education": "102",
                "civic": "103",
                "health": "104",
                "others": "100"
            }
        
        db['settings']['passkeys'][dept.lower()] = str(new_key).strip()
        write_db(db)
        self.send_json_response(200, {"success": True, "passkeys": db['settings']['passkeys']})

    def handle_broadcast_notification(self, body_bytes):
        user_email = self.get_auth_user()
        if not user_email or user_email.lower() not in AUTHORITY_ROLES:
            self.send_json_response(401, {"error": "Access token is missing or invalid authority"})
            return
        try:
            req_data = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"error": "Invalid JSON body"})
            return
        
        category = req_data.get('category')
        message = req_data.get('message')
        
        if not category or not message:
            self.send_json_response(400, {"error": "Category and Message are required"})
            return
            
        db = read_db()
        if 'notifications' not in db:
            db['notifications'] = []
            
        new_notif = {
            "id": "NTF-" + str(int(datetime.now().timestamp() * 1000)),
            "sender": user_email,
            "category": category,
            "message": message,
            "timestamp": datetime.now().strftime('%d %b %Y %I:%M %p')
        }
        db['notifications'].append(new_notif)
        write_db(db)
        self.send_json_response(200, {"success": True, "notification": new_notif})

    def send_json_response(self, status, obj):
        self.send_response(status)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode('utf-8'))

def run_server():
    server = HTTPServer(('0.0.0.0', PORT), PrajaMitraHandler)
    print(f"PrajaMitra Python Backend running at http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    run_server()
