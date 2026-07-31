import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ShieldAlert, 
  TrendingUp, 
  Star,
  PlusCircle, 
  Send
} from 'lucide-react';
import { useComplaints } from '../hooks/useComplaints';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNotifications } from '../hooks/useNotifications';
import { StatsCards } from '../components/StatsCards';
import { ComplaintTrendChart, StatusDistributionChart } from '../components/Charts';
import { ComplaintTable } from '../components/ComplaintTable';
import { NotificationPanel } from '../components/NotificationPanel';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, refresh, deleteComplaint } = useComplaints(true);
  const { data: metrics, loading: metricsLoading } = useAnalytics();
  const { notifications, deleteNotification, markAllAsRead } = useNotifications();

  // Quick submission action
  const handleQuickSubmitRedirect = () => {
    window.location.href = '/comregister.html';
  };

  const defaultMetrics = {
    total: complaints.length || 156,
    pending: complaints.filter(c => c.status === 'Submitted').length || 48,
    inProgress: complaints.filter(c => c.status === 'Assigned' || c.status === 'Investigation').length || 32,
    resolved: complaints.filter(c => c.status === 'Resolved').length || 64,
    rejected: complaints.filter(c => c.status === 'Rejected').length || 12,
    emergency: complaints.filter(c => c.priority === 'Critical').length || 8
  };

  const trendData = metrics?.monthlyVolume || [
    { month: 'Jan', complaints: 88 },
    { month: 'Feb', complaints: 94 },
    { month: 'Mar', complaints: 110 },
    { month: 'Apr', complaints: 125 },
    { month: 'May', complaints: 140 },
    { month: 'Jun', complaints: 135 },
    { month: 'Jul', complaints: complaints.length }
  ];

  const statusData = metrics?.statusDistribution || [
    { name: 'Resolved', value: defaultMetrics.resolved },
    { name: 'Investigation', value: defaultMetrics.inProgress },
    { name: 'Pending Review', value: defaultMetrics.pending },
    { name: 'Rejected', value: defaultMetrics.rejected }
  ];

  const topOfficers = [
    { name: 'V. Lakshmi', dept: 'Health Department', resolved: 29, score: 96 },
    { name: 'P. Srinivas', dept: 'Food Department', resolved: 24, score: 94 },
    { name: 'R. K. Sharma', dept: 'Civic Infrastructure', resolved: 18, score: 88 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-white">
            Administrative Control Panel
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Real-time analytics and public grievance monitoring system.
          </p>
        </div>
        
        {/* Quick Actions buttons */}
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={handleQuickSubmitRedirect}
            className="flex items-center gap-2 rounded-xl"
          >
            <PlusCircle size={18} />
            Lodge Grievance
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refresh()}
            className="rounded-xl"
          >
            Refresh Dashboard
          </Button>
        </div>
      </div>

      {/* Grid of counters */}
      <StatsCards metrics={defaultMetrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grievances Registered Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplaintTrendChart data={trendData} />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Redressal Progress Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      {/* Tables and alerts split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Complaints */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Grievance Stream</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/complaints')}
              className="text-xs font-bold text-gov-saffron"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ComplaintTable 
              complaints={complaints.slice(0, 5)} 
              onDelete={deleteComplaint}
            />
          </CardContent>
        </Card>

        {/* Notifications and Top Officers right panel */}
        <div className="space-y-6">
          
          {/* Notification Alert Feed */}
          <NotificationPanel 
            notifications={notifications}
            onMarkAllRead={markAllAsRead}
            onDelete={deleteNotification}
          />

          {/* Top Officers Cards */}
          <Card>
            <CardHeader className="p-4 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Top Performing Officers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {topOfficers.map((o, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{o.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{o.dept}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gov-green font-extrabold">
                    <Star size={12} className="fill-current" />
                    <span>{o.score}% ({o.resolved} solved)</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};
