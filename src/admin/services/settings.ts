import { apiFetch } from './api';

export interface SystemSettings {
  appName: string;
  contactEmail: string;
  contactPhone: string;
  enableAISummary: boolean;
  enableDuplicateDetection: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    try {
      return await apiFetch<SystemSettings>('/api/settings');
    } catch {
      return {
        appName: 'PrajaMitra Redressal Portal',
        contactEmail: 'support.prajamitra@gov.in',
        contactPhone: '1800-11-22-33',
        enableAISummary: true,
        enableDuplicateDetection: true,
        smsNotifications: true,
        emailNotifications: true
      };
    }
  },

  async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
    try {
      return await apiFetch<SystemSettings>('/api/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
    } catch {
      return settings;
    }
  },

  async updatePasskey(department: string, passkey: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/settings/update-passkey', {
      method: 'POST',
      body: JSON.stringify({ department, passkey })
    });
  }
};
