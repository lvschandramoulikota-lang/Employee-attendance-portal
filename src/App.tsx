import React, { useState, useEffect } from 'react';
import { Employee, AdminUser } from './types';
import { EmployeeLogin } from './components/EmployeePortal/EmployeeLogin';
import { EmployeeDashboard } from './components/EmployeePortal/EmployeeDashboard';
import { AdminLogin } from './components/AdminLogin';
import { AdminHeader } from './components/AdminPortal/AdminHeader';
import { AdminOverview } from './components/AdminPortal/AdminOverview';
import { EmployeeManagement } from './components/AdminPortal/EmployeeManagement';
import { ShiftManagement } from './components/AdminPortal/ShiftManagement';
import { GeofenceManagement } from './components/AdminPortal/GeofenceManagement';
import { AttendanceAudit } from './components/AdminPortal/AttendanceAudit';
import { ExcelReports } from './components/AdminPortal/ExcelReports';

type PortalMode = 'employee_login' | 'employee_dashboard' | 'admin_login' | 'admin_portal';

export default function App() {
  const [portalMode, setPortalMode] = useState<PortalMode>('employee_login');
  const [employeeUser, setEmployeeUser] = useState<Employee | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<string>('overview');

  // Load stored sessions on mount
  useEffect(() => {
    const savedEmp = localStorage.getItem('workforceiq_employee');
    const savedAdmin = localStorage.getItem('workforceiq_admin');

    if (savedEmp) {
      try {
        const emp = JSON.parse(savedEmp);
        setEmployeeUser(emp);
        setPortalMode('employee_dashboard');
        return;
      } catch (e) {
        localStorage.removeItem('workforceiq_employee');
      }
    }

    if (savedAdmin) {
      try {
        const adm = JSON.parse(savedAdmin);
        setAdminUser(adm);
        setPortalMode('admin_portal');
        return;
      } catch (e) {
        localStorage.removeItem('workforceiq_admin');
      }
    }
  }, []);

  const handleEmployeeLoginSuccess = (user: Employee) => {
    setEmployeeUser(user);
    localStorage.setItem('workforceiq_employee', JSON.stringify(user));
    setPortalMode('employee_dashboard');
  };

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setAdminUser(admin);
    localStorage.setItem('workforceiq_admin', JSON.stringify(admin));
    setPortalMode('admin_portal');
  };

  const handleLogout = () => {
    localStorage.removeItem('workforceiq_employee');
    localStorage.removeItem('workforceiq_admin');
    setEmployeeUser(null);
    setAdminUser(null);
    setPortalMode('employee_login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. Employee Login Screen */}
      {portalMode === 'employee_login' && (
        <EmployeeLogin
          onLoginSuccess={handleEmployeeLoginSuccess}
          onSwitchToAdmin={() => setPortalMode('admin_login')}
        />
      )}

      {/* 2. Employee Dashboard Screen */}
      {portalMode === 'employee_dashboard' && employeeUser && (
        <EmployeeDashboard employee={employeeUser} onLogout={handleLogout} />
      )}

      {/* 3. Admin Login Screen */}
      {portalMode === 'admin_login' && (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onSwitchToEmployee={() => setPortalMode('employee_login')}
        />
      )}

      {/* 4. Admin Management Portal */}
      {portalMode === 'admin_portal' && adminUser && (
        <div className="min-h-screen flex flex-col">
          <AdminHeader
            adminUser={adminUser}
            activeTab={activeAdminTab}
            setActiveTab={setActiveAdminTab}
            onLogout={handleLogout}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {activeAdminTab === 'overview' && <AdminOverview />}
            {activeAdminTab === 'employees' && <EmployeeManagement />}
            {activeAdminTab === 'shifts' && <ShiftManagement />}
            {activeAdminTab === 'geofences' && <GeofenceManagement />}
            {activeAdminTab === 'attendance' && <AttendanceAudit />}
            {activeAdminTab === 'reports' && <ExcelReports />}
          </main>
        </div>
      )}
    </div>
  );
}
