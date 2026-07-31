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

# Database helper functions
def read_db():
    if not os.path.exists(DB_FILE):
        init_data = {"users": [], "complaints": []}
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(init_data, f, indent=2)
        return init_data
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"users": [], "complaints": []}

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
            self.handle_user_history()
            return

        # Complaint Statistics
        elif path == '/api/complaints/stats':
            self.handle_stats()
            return

        # 2. Static Files Server
        if path == '/' or path == '':
            path = '/main.html'
            
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

    def handle_user_history(self):
        user_email = self.get_auth_user()
        if not user_email:
            self.send_json_response(401, {"error": "Access token is missing or invalid"})
            return
            
        db = read_db()
        history = []
        for c in db['complaints']:
            if not c.get('anonymous') and c.get('reporter') and c['reporter'].get('email', '').lower() == user_email.lower():
                history.append(c)
                
        self.send_json_response(200, history)

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
