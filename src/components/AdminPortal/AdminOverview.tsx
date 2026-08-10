import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  MapPin,
  Coffee,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { WorkforceStats, AttendanceRecord } from '../../types';
import { fetchWorkforceStats, fetchAttendanceRecords } from '../../lib/api';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<WorkforceStats | null>(null);
  const [recentPunches, setRecentPunches] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [s, recs] = await Promise.all([
        fetchWorkforceStats(),
        fetchAttendanceRecords({ date: todayStr }),
      ]);
      setStats(s);
      setRecentPunches(recs.slice(0, 6));
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Operational Live Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time geofenced attendance monitoring, shift compliance, and workforce status.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Staff</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalEmployees ?? 0}</p>
          <p className="text-[11px] text-slate-400">Registered workforce</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Present Today</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{stats?.presentToday ?? 0}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Checked-in employees</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Late Arrivals</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-800">{stats?.lateToday ?? 0}</p>
          <p className="text-[11px] text-amber-600 font-medium">Past grace period</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Absent / Off</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-800">{stats?.absentToday ?? 0}</p>
          <p className="text-[11px] text-rose-600 font-medium">Not checked in</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Geofence Compliance</span>
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-800">{stats?.geofenceCompliancePercentage ?? 100}%</p>
          <p className="text-[11px] text-indigo-600 font-medium">Validated inside radius</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Break</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.activeOnBreak ?? 0}</p>
          <p className="text-[11px] text-slate-400">Currently on break</p>
        </div>
      </div>

      {/* Geofence & System Security Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide uppercase text-indigo-200">
              Active Geofencing & Photo Safeguard Engine
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            All employee punches require high-accuracy GPS geolocation within office boundary radii, supplemented by selfie snapshot verification to completely eliminate proxy attendance.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60 shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">System Security</p>
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Enforced & Online
            </p>
          </div>
        </div>
      </div>

      {/* Today's Punch Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Today's Live Punch Activity Log</h3>
            <p className="text-xs text-slate-500">Recent check-in events logged with GPS location and photo audit</p>
          </div>
        </div>

        {recentPunches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No check-in punches recorded yet for today.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPunches.map((rec) => (
              <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                    {rec.checkInPhoto ? (
                      <img src={rec.checkInPhoto} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      rec.employeeName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{rec.employeeName}</p>
                    <p className="text-[11px] text-slate-500">{rec.department} • ID: {rec.employeeId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-800">
                      {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : '--'}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {rec.checkInGeofenceName || 'Office Radius'} ({rec.checkInAccuracy}m GPS)
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      rec.status === 'Punctual'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'Late'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
