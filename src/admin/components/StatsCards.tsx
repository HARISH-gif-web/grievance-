import React from 'react';
import { 
  FileText, 
  Clock, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  ShieldAlert,
  FolderOpen
} from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface StatsCardsProps {
  metrics: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    emergency: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ metrics }) => {
  
  const cards = [
    { 
      title: 'Total Grievances', 
      value: metrics.total, 
      desc: 'All time complaints', 
      icon: FileText, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      progress: 100 
    },
    { 
      title: 'Pending Reviews', 
      value: metrics.pending, 
      desc: 'Awaiting triage', 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      progress: Math.round((metrics.pending / (metrics.total || 1)) * 100)
    },
    { 
      title: 'In Investigation', 
      value: metrics.inProgress, 
      desc: 'Assigned to officers', 
      icon: Hourglass, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      progress: Math.round((metrics.inProgress / (metrics.total || 1)) * 100)
    },
    { 
      title: 'Resolved Cases', 
      value: metrics.resolved, 
      desc: 'Successfully closed', 
      icon: CheckCircle2, 
      color: 'text-green-600', 
      bg: 'bg-green-50 dark:bg-green-950/20',
      progress: Math.round((metrics.resolved / (metrics.total || 1)) * 100)
    },
    { 
      title: 'Emergency Alerts', 
      value: metrics.emergency, 
      desc: 'High severity actions', 
      icon: ShieldAlert, 
      color: 'text-red-600 animate-pulse', 
      bg: 'bg-red-50 dark:bg-red-950/20',
      progress: Math.round((metrics.emergency / (metrics.total || 1)) * 100)
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {cards.map((card, i) => (
        <Card 
          key={i} 
          className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <span className="text-2xl font-extrabold text-slate-900 mt-2 dark:text-white">
                  {card.value}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                <div 
                  className={`h-full rounded-full ${
                    card.color.includes('green') ? 'bg-green-500' :
                    card.color.includes('amber') ? 'bg-amber-500' :
                    card.color.includes('purple') ? 'bg-purple-500' :
                    card.color.includes('red') ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${card.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-slate-400">
                <span>{card.desc}</span>
                <span>{card.progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
