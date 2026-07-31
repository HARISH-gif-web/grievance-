import { apiFetch } from './api';
import { User } from '../types';

export const usersService = {
  async getAll(): Promise<User[]> {
    return apiFetch<User[]>('/api/users');
  },

  async updateRole(id: string, role: User['role']): Promise<User> {
    return apiFetch<User>('/api/users/update-role', {
      method: 'POST',
      body: JSON.stringify({ id, role })
    });
  },

  async updateDepartment(id: string, department: string): Promise<User> {
    return apiFetch<User>('/api/users/update-department', {
      method: 'POST',
      body: JSON.stringify({ id, department })
    });
  },

  async toggleStatus(id: string, status: User['status']): Promise<User> {
    // In our backend database, we can update status dynamically
    return apiFetch<User>('/api/users/update-status', {
      method: 'POST',
      body: JSON.stringify({ id, status })
    });
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/users/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  }
};
