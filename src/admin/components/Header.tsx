import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  Globe, 
  UserCircle,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen }) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [lang, setLang] = useState(localStorage.getItem('prajamitra_lang') || 'en');
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // Tick date-time
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleDarkMode = () => {
    const updated = !darkMode;
    setDarkMode(updated);
    if (updated) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setLang(selected);
    localStorage.setItem('prajamitra_lang', selected);
    // Refresh page if translate hook needs re-render
    window.location.reload();
  };

  const formattedDate = dateTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = dateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 dark:bg-slate-900 dark:border-slate-800">
      
      {/* Left Area: Mobile toggler & page context */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
        >
          <Menu size={20} />
        </button>
        
        {/* Date Time display */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">National Informatics Secretariat</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formattedDate} • <span className="font-mono text-gov-saffron">{formattedTime}</span></span>
        </div>
      </div>

      {/* Right Area: Controls */}
      <div className="flex items-center gap-4">
        
        {/* Language selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl dark:bg-slate-800/50 dark:border-slate-800">
          <Globe size={15} className="text-slate-400" />
          <select 
            value={lang}
            onChange={handleLanguageChange}
            className="text-xs font-bold bg-transparent text-slate-700 border-none outline-none cursor-pointer dark:text-slate-300"
          >
            <option value="en">English (EN)</option>
            <option value="te">తెలుగు (TE)</option>
            <option value="hi">हिन्दी (HI)</option>
            <option value="ta">தமிழ் (TA)</option>
          </select>
        </div>

        {/* Light Dark toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 relative dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] font-bold h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="p-4 border-b border-slate-50 flex justify-between items-center dark:border-slate-850">
                <span className="font-bold text-slate-900 dark:text-white">Recent Alerts</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-gov-saffron hover:underline font-bold"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-850">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No active notifications.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-850 ${!n.read ? 'bg-orange-50/20 dark:bg-orange-950/10' : ''}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setNotifOpen(false)}
                className="w-full text-center py-2.5 border-t border-slate-50 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-slate-850"
              >
                Close Menu
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-xl transition-colors dark:hover:bg-slate-800"
          >
            <div className="h-8 w-8 bg-gov-navy text-white rounded-lg flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Administrator</span>
              <span className="text-[9px] font-bold text-slate-400">Ministry of Grievances</span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="p-3 border-b border-slate-50 dark:border-slate-850">
                <div className="text-xs text-slate-400">Logged in as</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{localStorage.getItem('prajamitra_user_email') || 'admin@gov.in'}</div>
              </div>
              <div className="p-1.5">
                <button 
                  onClick={() => { setProfileOpen(false); window.location.href = '/admin/profile'; }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  My Profile
                </button>
                <button 
                  onClick={() => { setProfileOpen(false); window.location.href = '/admin/settings'; }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  System Settings
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
