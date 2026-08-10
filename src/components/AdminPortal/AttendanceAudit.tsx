import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  MapPin,
  Loader2,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { fetchAttendanceRecords, getExcelExportUrl } from '../../lib/api';

export const AttendanceAudit: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Photo viewer modal
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchAttendanceRecords({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [startDate, endDate]);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportUrl = getExcelExportUrl({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            Attendance Audit & Punch Log History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete verification logs of employee punches, GPS geolocation accuracy, selfie audit snapshots, breaks, and overtime.
          </p>
        </div>

        <a
          href={exportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Filtered Excel Log
        </a>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-gray-100 placeholder-slate-500 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Punch Statuses</option>
            <option value="Punctual">Punctual</option>
            <option value="Late">Late</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-1/2 px-2.5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            title="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-1/2 px-2.5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            title="End Date"
          />
        </div>
      </div>

      {/* Attendance Audit Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Fetching attendance audit records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No attendance records match your active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Employee</th>
                  <th className="py-3.5 px-4">Check-In Punch</th>
                  <th className="py-3.5 px-4">Check-Out Punch</th>
                  <th className="py-3.5 px-4">Geofence GPS Audit</th>
                  <th className="py-3.5 px-4">Breaks & Hours</th>
                  <th className="py-3.5 px-4 text-center">Audit Status</th>
                  <th className="py-3.5 px-4 text-right">Selfie Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-mono text-[11px] text-indigo-400 font-semibold">{r.date}</p>
                        <p className="font-bold text-gray-100">{r.employeeName}</p>
                        <p className="text-[10px] text-slate-500">{r.department} • ID: {r.employeeId}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {r.checkInTime ? (
                        <div>
                          <p className="font-medium text-slate-200">
                            {new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Lat: {r.checkInLat?.toFixed(4)}, Lng: {r.checkInLng?.toFixed(4)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not Checked In</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {r.checkOutTime ? (
                        <div>
                          <p className="font-medium text-slate-200">
                            {new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          {r.overtimeMinutes > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                              +{r.overtimeMinutes}m OT
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-400/80 text-[11px] font-medium">On Shift</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className={`w-3.5 h-3.5 ${r.checkInGeofenceValid ? 'text-emerald-400' : 'text-rose-400'}`} />
                          <span className="font-medium text-slate-200">{r.checkInGeofenceName || 'Office Boundary'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Accuracy: <span className="font-mono text-slate-300">{r.checkInAccuracy || 0}m</span> GPS
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-200">
                        {r.workedMinutes ? (r.workedMinutes / 60).toFixed(2) : '0.00'} hrs worked
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Breaks: {r.totalBreakMinutes || 0} mins ({r.breaks?.length || 0} sessions)
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          r.status === 'Punctual'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : r.status === 'Late'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {r.checkInPhoto ? (
                        <button
                          onClick={() => setSelectedPhoto({ url: r.checkInPhoto!, title: `${r.employeeName} — Punch Selfie` })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-medium transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Snapshot
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">No Photo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selfie Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-gray-100">{selectedPhoto.title}</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-black flex items-center justify-center">
              <img src={selectedPhoto.url} alt="Selfie Audit" className="w-full h-full object-cover" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
