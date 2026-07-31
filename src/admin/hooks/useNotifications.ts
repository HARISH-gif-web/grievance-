import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';
import { apiFetch } from '../services/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In python server, let's load broadcast logs or mock notifications
      const logs = await apiFetch<{ alerts?: any[] }>('/api/notifications').catch(() => ({ alerts: [] }));
      const alertsData: Notification[] = (logs.alerts || []).map((alert: any, idx: number) => ({
        id: `NOT-${idx}`,
        title: `📢 ${alert.category.toUpperCase()} Broadcast Alert`,
        message: alert.message,
        category: alert.category,
        date: alert.date,
        read: false
      }));

      // Fallback fallback notifications if empty
      if (alertsData.length === 0) {
        setNotifications([
          { id: 'NOT-1', title: '🚨 Emergency Complaint Registered', message: 'Urgent Guntur Civic road block reported.', category: 'Civic', date: 'Just now', read: false },
          { id: 'NOT-2', title: '📝 Rations Stock Broadcast', message: 'Announced food grains allotment to Anna Canteen.', category: 'Food', date: '2 hours ago', read: false },
          { id: 'NOT-3', title: '🎓 Board Fees Remittance', message: 'District education grant status has been finalized.', category: 'Education', date: '1 day ago', read: true }
        ]);
      } else {
        setNotifications(alertsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications stream');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const broadcastAlert = async (category: string, message: string) => {
    try {
      await apiFetch('/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ category, message })
      });
      fetchNotifications();
    } catch (err: any) {
      throw new Error(err.message || 'Alert broadcast failed');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    broadcast: broadcastAlert,
    refresh: fetchNotifications
  };
}
