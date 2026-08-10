import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { ShiftSchedule } from '../../types';
import { fetchShifts, createShift, updateShift, deleteShift } from '../../lib/api';

export const ShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftSchedule | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    gracePeriodMinutes: 15,
    allowedBreakMinutes: 60,
    overtimeThresholdMinutes: 480,
  });

  const loadShifts = async () => {
    setLoading(true);
    try {
      const list = await fetchShifts();
      setShifts(list);
    } catch (err) {
      console.error('Failed to load shift schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const openAddModal = () => {
    setEditingShift(null);
    setFormData({
      name: 'Morning Core Shift',
      startTime: '09:00',
      endTime: '17:00',
      gracePeriodMinutes: 15,
      allowedBreakMinutes: 60,
      overtimeThresholdMinutes: 480,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (shift: ShiftSchedule) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      allowedBreakMinutes: shift.allowedBreakMinutes,
      overtimeThresholdMinutes: shift.overtimeThresholdMinutes || 480,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.startTime || !formData.endTime) {
      setFormError('Shift name, start time, and end time are required.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingShift) {
        await updateShift(editingShift.id, formData);
      } else {
        await createShift(formData);
      }
      setIsModalOpen(false);
      loadShifts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save shift.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete shift schedule "${name}"?`)) {
      try {
        await deleteShift(id);
        loadShifts();
      } catch (err) {
        alert('Failed to delete shift schedule.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Shift Schedules & Grace Period Rules
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure work shift timings, late-arrival grace thresholds, break allowances, and overtime triggers.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Shift Schedule
        </button>
      </div>

      {/* Shifts Cards Grid */}
      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading shift schedules...
        </div>
      ) : shifts.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          No shift schedules found. Create your first shift schedule above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Shift Window</p>
                    <p className="text-sm font-bold text-slate-800">
                      {s.startTime} — {s.endTime}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-100">
                    8 Hours
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium">Late Grace Period</p>
                    <p className="font-bold text-amber-900 text-sm mt-0.5">{s.gracePeriodMinutes} mins</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] text-slate-500 font-medium">Allowed Break</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{s.allowedBreakMinutes} mins</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Overtime Threshold: {s.overtimeThresholdMinutes / 60} hrs</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Shift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingShift ? 'Edit Shift Schedule' : 'Create New Shift Schedule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Schedule Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                  placeholder="e.g. Standard Morning Shift"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Late Grace Period (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.gracePeriodMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Allowed Break (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.allowedBreakMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, allowedBreakMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
