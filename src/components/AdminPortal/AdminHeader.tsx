import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  MapPin,
  ClipboardList,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  Shield,
} from 'lucide-react';
import { AdminUser } from '../../types';
import { ChangePasswordModal } from '../ChangePasswordModal';

interface AdminHeaderProps {
  adminUser: AdminUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminUser,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'shifts', label: 'Shifts', icon: Clock },
    { id: 'geofences', label: 'Geofences', icon: MapPin },
    { id: 'attendance', label: 'Attendance Audit', icon: ClipboardList },
    { id: 'reports', label: 'Excel Reports', icon: FileSpreadsheet },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">WorkforceIQ</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold uppercase tracking-wider">
                  Admin Management
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Enterprise Attendance & Operations Control</p>
            </div>
          </div>

          {/* Admin Account Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">{adminUser.name}</p>
                <p className="text-[10px] text-slate-400">{adminUser.email}</p>
              </div>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Change Password</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <ChangePasswordModal
        adminId={adminUser.id}
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
};
