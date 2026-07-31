import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  FileText,
  UserCheck,
  Search,
  Sparkles,
  TrendingDown,
  Info
} from 'lucide-react';
import { useComplaints } from '../hooks/useComplaints';
import { officersService } from '../services/officers';
import { Officer, Complaint } from '../types';
import { getStatusColor, getPriorityColor } from '../utils/colors';
import { formatDate } from '../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [searchId, setSearchId] = useState('');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [targetOfficerId, setTargetOfficerId] = useState('');
  const [notesText, setNotesText] = useState('');

  const { assignOfficer, updateStatus } = useComplaints(true);

  // Fetch list of officers
  useEffect(() => {
    officersService.getAll().then(setOfficers);
  }, []);

  // Fetch single complaint details
  const fetchComplaintDetails = async (targetId: string) => {
    setLoading(true);
    try {
      const data = await apiFetchComplaint(targetId);
      setComplaint(data);
      setTargetOfficerId(data.assignedOfficerId || '');
      setNotesText(data.officerNotes || '');
    } catch (err) {
      alert('Error: Complaint ID not found or server is offline.');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const apiFetchComplaint = async (cid: string): Promise<Complaint> => {
    const list = await fetch(window.location.origin + '/api/complaints/user-history?all=true')
      .then(res => res.json()) as Complaint[];
    const item = list.find(c => c.id === cid);
    if (!item) throw new Error();
    return item;
  };

  useEffect(() => {
    if (id) {
      fetchComplaintDetails(id);
    }
  }, [id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      fetchComplaintDetails(searchId.trim());
    }
  };

  const handleAssignSubmit = async () => {
    if (!complaint) return;
    const officer = officers.find(o => o.id === targetOfficerId);
    if (!officer) {
      alert('Please select an officer.');
      return;
    }
    try {
      const updated = await assignOfficer(complaint.id, officer.id, officer.name);
      setComplaint(updated);
      alert('Officer assigned successfully.');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleStatusChange = async (status: Complaint['status']) => {
    if (!complaint) return;
    try {
      const updated = await updateStatus(complaint.id, status, notesText);
      setComplaint(updated);
      alert(`Grievance status updated to ${status}.`);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  // If no ID is searched or route is clean
  if (!id && !complaint) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="text-4xl">🔍</div>
        <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Grievance Inspector Portal</h1>
        <p className="text-xs text-slate-400">Enter a 12-digit ticket reference ID to display timeline logs and AI parameters audit.</p>
        
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Reference ID (e.g. PM-2026-X839A)"
            className="flex-1 h-11 rounded-xl"
          />
          <Button variant="primary" type="submit" className="rounded-xl bg-gov-navy">
            Search
          </Button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <span className="animate-spin text-2xl inline-block mr-2">⚙️</span> Processing audit data...
      </div>
    );
  }

  if (!complaint) return null;

  // AI Sentiment Score and Duplicate simulation parameters
  const sentimentScore = complaint.sentiment || 'Neutral';
  const severityScore = complaint.severityScore || (complaint.priority === 'Critical' ? 95 : complaint.priority === 'High' ? 82 : 45);
  const duplicateDetected = complaint.isDuplicate ?? false;

  return (
    <div className="space-y-6 text-left">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/admin/complaints')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Database
      </button>

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-extrabold text-lg text-gov-saffron">{complaint.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1 dark:text-white">{complaint.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
            {complaint.status}
          </span>
        </div>
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Complaint descriptions, media, maps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info */}
          <Card>
            <CardHeader>
              <CardTitle>Grievance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                {complaint.description}
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Citizen Name</span>
                  <span className="font-bold text-slate-900 mt-1 block dark:text-white">{complaint.citizenName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Contact Detail</span>
                  <span className="font-bold text-slate-900 mt-1 block dark:text-white">{complaint.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Depart Category</span>
                  <span className="font-bold text-slate-900 mt-1 block dark:text-white">{complaint.category} ({complaint.subcategory})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Location Area</span>
                  <span className="font-bold text-slate-900 mt-1 block dark:text-white">{complaint.village}, {complaint.district}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Photo */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 dark:border-slate-800 text-center">
                  <span className="text-sm font-bold block mb-2 text-slate-600 dark:text-slate-300">Evidence Image</span>
                  {complaint.evidencePhoto ? (
                    <img 
                      src={complaint.evidencePhoto} 
                      alt="Attachment Snapshot" 
                      className="max-h-32 mx-auto rounded-lg object-cover cursor-pointer"
                      onClick={() => window.open(complaint.evidencePhoto)}
                    />
                  ) : (
                    <span className="text-xs text-slate-450 italic">No image uploaded.</span>
                  )}
                </div>

                {/* Audio */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 dark:border-slate-800 text-center">
                  <span className="text-sm font-bold block mb-2 text-slate-600 dark:text-slate-300">Voice Evidence</span>
                  {complaint.evidenceAudio ? (
                    <audio src={complaint.evidenceAudio} controls className="w-full mt-4" />
                  ) : (
                    <span className="text-xs text-slate-450 italic">No voice evidence recorded.</span>
                  )}
                </div>

                {/* Video */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 dark:border-slate-800 text-center">
                  <span className="text-sm font-bold block mb-2 text-slate-600 dark:text-slate-300">Video Evidence</span>
                  {complaint.evidenceVideo ? (
                    <button 
                      onClick={() => window.open(complaint.evidenceVideo)}
                      className="px-3 py-1.5 bg-gov-navy text-white text-xs font-bold rounded-lg mt-4"
                    >
                      Play video evidence
                    </button>
                  ) : (
                    <span className="text-xs text-slate-450 italic">No video clips attached.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate map frame */}
          <Card>
            <CardHeader>
              <CardTitle>Grievance Coordinates Map</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-64 overflow-hidden rounded-b-2xl relative bg-slate-100">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-slate-850">
                <MapPin size={28} className="text-gov-saffron animate-bounce" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Location: {complaint.latitude || '16.3067'}° N, {complaint.longitude || '80.4365'}° E
                </span>
                <span className="text-[10px] text-slate-400">{complaint.village}, {complaint.district}</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: AI properties, Timeline list, Officer triage */}
        <div className="space-y-6">
          
          {/* AI Intelligence Metrics panel */}
          <Card className="border-gov-navy/20 dark:border-gov-navy/40">
            <CardHeader className="bg-gov-navy/5 p-4 flex flex-row items-center gap-2 dark:bg-gov-navy/10">
              <Sparkles size={16} className="text-gov-navy" />
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                AI Copilot Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Sentiment */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Public Sentiment</span>
                <span className={`font-bold px-2 py-0.5 rounded-lg ${sentimentScore === 'Negative' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                  {sentimentScore}
                </span>
              </div>

              {/* Duplication detection */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Clustered Duplicates</span>
                <span className={`font-bold px-2 py-0.5 rounded-lg ${duplicateDetected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {duplicateDetected ? 'Duplicate Alarm' : 'Unique Case'}
                </span>
              </div>

              {/* Severity Score */}
              <div className="space-y-1.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Priority Severity Index</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">{severityScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                  <div className="h-full bg-gov-saffron" style={{ width: `${severityScore}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline tracker */}
          <Card>
            <CardHeader className="p-4 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Resolution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative border-l-2 border-slate-100 pl-4 space-y-5 dark:border-slate-850 text-left">
                {(complaint.timeline || []).map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[23px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${step.completed ? 'bg-gov-green' : 'bg-slate-200'}`}></span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${step.completed ? 'text-slate-850 dark:text-slate-100' : 'text-slate-400'}`}>{step.status}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{step.desc}</span>
                      <span className="text-[9px] text-slate-350 mt-1">{step.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assign and Status Triage card */}
          <Card>
            <CardHeader className="p-4 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Task Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              {/* Select Officer */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assign Department Officer</label>
                <div className="flex gap-2">
                  <select
                    value={targetOfficerId}
                    onChange={(e) => setTargetOfficerId(e.target.value)}
                    className="flex-1 h-10 px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-300"
                  >
                    <option value="">-- Choose Officer --</option>
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <Button variant="primary" size="sm" onClick={handleAssignSubmit} className="rounded-lg">
                    Assign
                  </Button>
                </div>
              </div>

              {/* Notes Area */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Administrative Officer Notes</label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Insert updates, verification findings, or audit resolutions notes..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg h-24 outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-300"
                />
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleStatusChange('Investigation')}
                  className="rounded-lg text-purple-700 dark:text-purple-400 border-purple-100 hover:bg-purple-50 dark:border-purple-900/30"
                >
                  Start Investigation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleStatusChange('Resolved')}
                  className="rounded-lg text-green-700 dark:text-green-400 border-green-100 hover:bg-green-50 dark:border-green-900/30"
                >
                  Resolve Case
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleStatusChange('Rejected')}
                  className="rounded-lg text-red-700 dark:text-red-400 border-red-100 hover:bg-red-50 dark:border-red-900/30"
                >
                  Reject Case
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleStatusChange('Submitted')}
                  className="rounded-lg text-slate-600 dark:text-slate-300 border-slate-100 hover:bg-slate-50 dark:border-slate-800"
                >
                  Reopen Case
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};
