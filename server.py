import os
import json
import uuid
import hashlib
import mimetypes
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timedelta

PORT = 3000
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
            
        else:
            self.send_error(404, 'API Endpoint Not Found')

    # ==========================================================================
    # API HANDLER IMPLEMENTATIONS
    # ==========================================================================

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
