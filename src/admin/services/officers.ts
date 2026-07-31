import { apiFetch } from './api';
import { Officer } from '../types';

export const officersService = {
  async getAll(): Promise<Officer[]> {
    try {
      return await apiFetch<Officer[]>('/api/officers');
    } catch {
      // Mock fallback if API not implemented
      return [
        { id: 'OFF-1', name: 'R. K. Sharma', department: 'Civic Infrastructure', designation: 'Superintending Engineer', district: 'Guntur', email: 'sharma.civic@gov.in', phone: '9848022331', assignedComplaints: 24, completedComplaints: 18, performanceScore: 88 },
        { id: 'OFF-2', name: 'V. Lakshmi', department: 'Health Department', designation: 'Medical Officer', district: 'Vijayawada', email: 'lakshmi.health@gov.in', phone: '9440122334', assignedComplaints: 12, completedComplaints: 11, performanceScore: 94 },
        { id: 'OFF-3', name: 'P. Srinivas', department: 'Food Department', designation: 'Food Safety Officer', district: 'Nellore', email: 'srinivas.food@gov.in', phone: '9866033445', assignedComplaints: 30, completedComplaints: 29, performanceScore: 97 },
        { id: 'OFF-4', name: 'K. Santhosh', department: 'Education Department', designation: 'District Educational Officer', district: 'Kurnool', email: 'santhosh.edu@gov.in', phone: '9988776655', assignedComplaints: 8, completedComplaints: 4, performanceScore: 72 }
      ];
    }
  },

  async add(officer: Omit<Officer, 'id' | 'assignedComplaints' | 'completedComplaints' | 'performanceScore'>): Promise<Officer> {
    try {
      return await apiFetch<Officer>('/api/officers', {
        method: 'POST',
        body: JSON.stringify(officer)
      });
    } catch {
      const newOfficer: Officer = {
        ...officer,
        id: `OFF-${Math.floor(Math.random() * 1000)}`,
        assignedComplaints: 0,
        completedComplaints: 0,
        performanceScore: 100
      };
      return newOfficer;
    }
  },

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      return await apiFetch<{ success: boolean }>(`/api/officers/delete`, {
        method: 'POST',
        body: JSON.stringify({ id })
      });
    } catch {
      return { success: true };
    }
  }
};
