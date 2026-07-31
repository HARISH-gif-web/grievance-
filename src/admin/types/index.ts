export interface Complaint {
  id: string;
  citizenName: string;
  phone: string;
  email: string;
  category: 'Food' | 'Education' | 'Civic' | 'Health' | 'Other';
  subcategory: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Submitted' | 'Assigned' | 'Investigation' | 'Resolved' | 'Rejected';
  district: string;
  village: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  date: string;
  severityScore?: number;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  isDuplicate?: boolean;
  latitude?: string;
  longitude?: string;
  evidencePhoto?: string;
  evidenceAudio?: string;
  evidenceVideo?: string;
  officerNotes?: string;
  resolutionPhoto?: string;
  timeline: {
    status: string;
    desc: string;
    date: string;
    completed: boolean;
  }[];
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  role: 'Citizen' | 'Authority';
  status: 'Active' | 'Suspended';
  totalComplaints: number;
}

export interface Officer {
  id: string;
  name: string;
  department: string;
  designation: string;
  district: string;
  email: string;
  phone: string;
  assignedComplaints: number;
  completedComplaints: number;
  performanceScore: number; // 0 to 100
}

export interface Department {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  officerCount: number;
  resolvedCount: number;
  pendingCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  date: string;
  read: boolean;
}

export interface AnalyticsData {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  emergency: number;
  resolutionTimeTrend: { month: string; days: number }[];
  categoryDistribution: { name: string; value: number }[];
  monthlyVolume: { month: string; complaints: number }[];
  statusDistribution: { name: string; value: number }[];
  districtVolume: { district: string; count: number }[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
