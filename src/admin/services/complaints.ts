import { apiFetch } from './api';
import { Complaint } from '../types';

export const complaintsService = {
  async getAll(params?: { all?: boolean }): Promise<Complaint[]> {
    const query = params?.all ? '?all=true' : '';
    return apiFetch<Complaint[]>(`/api/complaints/user-history${query}`);
  },

  async getById(id: string): Promise<Complaint> {
    const list = await this.getAll({ all: true });
    const complaint = list.find(c => c.id === id);
    if (!complaint) throw new Error('Complaint not found');
    return complaint;
  },

  async assignOfficer(id: string, officerId: string, officerName: string): Promise<Complaint> {
    return apiFetch<Complaint>(`/api/complaints/assign`, {
      method: 'POST',
      body: JSON.stringify({ id, officerId, officerName })
    });
  },

  async updateStatus(id: string, status: Complaint['status'], notes?: string): Promise<Complaint> {
    return apiFetch<Complaint>(`/api/complaints/update-status`, {
      method: 'POST',
      body: JSON.stringify({ id, status, notes })
    });
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/complaints/delete`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }
};
