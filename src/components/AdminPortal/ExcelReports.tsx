import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Employee } from '../../types';
import { fetchEmployees, getExcelExportUrl } from '../../lib/api';

export const ExcelReports: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    fetchEmployees().then(setEmployees).catch(console.error);
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const downloadUrl = getExcelExportUrl({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    employeeId: selectedEmployeeId || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
        <h2 className="text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          Enterprise Excel Attendance Reports & Export Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Generate comprehensive audit-ready Microsoft Excel spreadsheets (.xlsx) containing punch timestamps, geofence compliance scores, worked hours, and break logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration Card */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            1. Report Parameters & Date Range
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-gray-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-gray-100 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Target Employee Scope
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Active Employees (Full Organization Report)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.employeeId}>
                  {e.name} ({e.employeeId}) — {e.department}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Spreadsheet (.xlsx)
            </a>
          </div>
        </div>

        {/* Report Features & Columns Reference */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Included Excel Audit Columns
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every exported report includes raw data points calculated automatically by the attendance engine:
          </p>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Employee Credentials:</strong> Name, ID, Department</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Punch Timestamps:</strong> Exact check-in and check-out times</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Geofence Verification:</strong> Compliance status & Location name</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>GPS Signal Accuracy:</strong> Signal margin in meters</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Shift & Overtime:</strong> Net worked hours & overtime mins</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
