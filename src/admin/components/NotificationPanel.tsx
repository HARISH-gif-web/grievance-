import React from 'react';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  AlertTriangle 
} from 'lucide-react';
import { Notification } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAllRead,
  onDelete
}) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gov-saffron" />
          <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            System Alerts
          </CardTitle>
        </div>
        <button
          onClick={onMarkAllRead}
          className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-1"
          title="Mark all read"
        >
          <CheckCheck size={14} />
          Clear
        </button>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[460px] divide-y divide-slate-50 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active notification logs.
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-4 flex gap-3 transition-colors ${!n.read ? 'bg-orange-500/5 dark:bg-orange-500/10' : 'bg-transparent'}`}
            >
              <div className="mt-0.5 text-orange-500">
                <AlertTriangle size={15} />
              </div>
              <div className="flex-1 flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400 leading-normal">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-2 font-medium">{n.date}</span>
              </div>
              <button
                onClick={() => onDelete(n.id)}
                className="text-slate-350 hover:text-red-500 self-start p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Remove alert"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
