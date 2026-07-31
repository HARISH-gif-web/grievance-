import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Users, 
  ShieldAlert, 
  FolderKanban, 
  LineChart, 
  FilePieChart, 
  Settings, 
  UserCircle, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('prajamitra_token');
    localStorage.removeItem('prajamitra_is_authority');
    localStorage.removeItem('prajamitra_user_email');
    navigate('/track.html?view=authority');
    window.location.reload();
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Complaints', path: '/admin/complaints', icon: FileText },
    { name: 'Complaint Details', path: '/admin/complaints/details', icon: Layers },
    { name: 'Citizens Register', path: '/admin/users', icon: Users },
    { name: 'Officers Desk', path: '/admin/officers', icon: ShieldAlert },
    { name: 'Departments', path: '/admin/departments', icon: FolderKanban },
    { name: 'Performance Analytics', path: '/admin/analytics', icon: LineChart },
    { name: 'Executive Reports', path: '/admin/reports', icon: FilePieChart },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
    { name: 'My Profile', path: '/admin/profile', icon: UserCircle }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 left-0 h-full z-40 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col justify-between transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div>
          {/* Header Branding */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 flex-shrink-0 bg-white rounded-lg p-1 flex items-center justify-center shadow-md">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
                  alt="Emblem" 
                  className="h-8 w-auto"
                />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-wider text-white">PrajaMitra</span>
                  <span className="text-[10px] font-bold text-gov-saffron tracking-widest uppercase">Admin Portal</span>
                </div>
              )}
            </div>
            
            {/* Collapse desktop button */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {menuItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-gov-saffron text-white shadow-md shadow-orange-500/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={item.name}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title="Log Out"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span>Exit Portal</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
