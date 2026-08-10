import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Clock,
  MapPin,
} from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { Employee, ShiftSchedule, OfficeLocation } from '../../types';

// Native Vite environment variable access
const metaEnv = (import.meta as any)?.env || {};
const supabaseUrl =
  (metaEnv.VITE_SUPABASE_URL as string) ||
  (metaEnv.NEXT_PUBLIC_SUPABASE_URL as string) ||
  (metaEnv.SUPABASE_URL as string) ||
  '';

const supabaseAnonKey =
  (metaEnv.VITE_SUPABASE_ANON_KEY as string) ||
  (metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  (metaEnv.SUPABASE_ANON_KEY as string) ||
  '';

const mapEmployee = (item: any): Employee => ({
  id: String(item.id),
  employeeId: String(item.employee_id || item.employeeId || item.id),
  name: String(item.name || item.full_name || 'Staff'),
  email: String(item.email || ''),
  department: String(item.department || 'Engineering'),
  designation: String(item.designation || item.role || 'Staff'),
  phone: String(item.phone || ''),
  role: item.role || 'employee',
  shiftId: String(item.assigned_shift || item.shift_id || item.shiftId || 'shift-1'),
  locationId: String(item.assigned_geofence || item.location_id || item.locationId || 'loc-1'),
  isActive: item.status === 'Active' || item.status === true || item.is_active === true || item.isActive !== false,
  createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
});

const mapShift = (item: any): ShiftSchedule => ({
  id: String(item.id),
  name: String(item.name || item.title || 'Shift Schedule'),
  startTime: String(item.start_time || item.startTime || '09:00'),
  endTime: String(item.end_time || item.endTime || '17:00'),
  gracePeriodMinutes: Number(item.grace_period_minutes || item.gracePeriodMinutes || 15),
  allowedBreakMinutes: Number(item.allowed_break_minutes || item.allowedBreakMinutes || 60),
  overtimeThresholdMinutes: Number(item.overtime_threshold_minutes || item.overtimeThresholdMinutes || 480),
  createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
});

const mapGeofence = (item: any): OfficeLocation => ({
  id: String(item.id),
  name: String(item.name || item.title || 'Office Zone'),
  address: String(item.address || ''),
  latitude: Number(item.latitude || item.lat || 37.7749),
  longitude: Number(item.longitude || item.lng || -122.4194),
  radiusMeters: Number(item.radius_meters || item.radiusMeters || 150),
  requiredAccuracyMeters: Number(item.required_accuracy_meters || item.requiredAccuracyMeters || 50),
  createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
});

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'Engineering',
    designation: 'Staff',
    phone: '',
    shiftId: '',
    locationId: '',
    password: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      // 1. Fetch employees directly from Supabase 'employees' table
      const { data: empData, error: empErr } = await supabase.from('employees').select('*');
      if (empErr) {
        console.warn('Direct Supabase fetch warning for employees:', empErr.message);
      }
      const fetchedEmps = empData ? empData.map(mapEmployee) : [];
      setEmployees(fetchedEmps);

      // 2. Fetch shifts directly from Supabase 'shifts' table
      const { data: shiftData } = await supabase.from('shifts').select('*');
      const fetchedShifts = shiftData ? shiftData.map(mapShift) : [];
      setShifts(fetchedShifts);

      // 3. Fetch geofences directly from Supabase 'geofences' or 'locations' table
      let fetchedLocs: OfficeLocation[] = [];
      const { data: geoData } = await supabase.from('geofences').select('*');
      if (geoData && geoData.length > 0) {
        fetchedLocs = geoData.map(mapGeofence);
      } else {
        const { data: locData } = await supabase.from('locations').select('*');
        if (locData && locData.length > 0) {
          fetchedLocs = locData.map(mapGeofence);
        }
      }
      setLocations(fetchedLocs);

      if (fetchedShifts.length > 0 && !formData.shiftId) {
        setFormData((prev) => ({ ...prev, shiftId: fetchedShifts[0].id }));
      }
      if (fetchedLocs.length > 0 && !formData.locationId) {
        setFormData((prev) => ({ ...prev, locationId: fetchedLocs[0].id }));
      }
    } catch (err) {
      console.error('Error fetching data directly from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      email: '',
      department: 'Engineering',
      designation: 'Software Engineer',
      phone: '',
      shiftId: shifts[0]?.id || '',
      locationId: locations[0]?.id || '',
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone,
      shiftId: emp.shiftId,
      locationId: emp.locationId,
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name) {
      setFormError('Employee Name is required.');
      return;
    }

    setFormLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      if (editingEmployee) {
        // Direct Supabase UPDATE
        const updatePayload: any = {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          designation: formData.designation,
          phone: formData.phone,
          employee_id: formData.employeeId,
          employeeId: formData.employeeId,
          assigned_shift: formData.shiftId,
          shift_id: formData.shiftId,
          shiftId: formData.shiftId,
          assigned_geofence: formData.locationId,
          location_id: formData.locationId,
          locationId: formData.locationId,
          status: 'Active',
          updated_at: new Date().toISOString(),
        };

        if (formData.password) {
          updatePayload.password_hash = formData.password;
          updatePayload.passwordHash = formData.password;
        }

        const { error } = await supabase
          .from('employees')
          .update(updatePayload)
          .eq('id', editingEmployee.id);

        if (error) {
          // Retry with simple core column payload
          await supabase
            .from('employees')
            .update({
              name: formData.name,
              email: formData.email,
              department: formData.department,
              assigned_shift: formData.shiftId,
              assigned_geofence: formData.locationId,
              status: 'Active',
            })
            .eq('id', editingEmployee.id);
        }
      } else {
        // Direct Supabase INSERT
        const newId = `emp-${Date.now()}`;
        const newRecord = {
          id: newId,
          employee_id: formData.employeeId,
          employeeId: formData.employeeId,
          name: formData.name,
          email: formData.email,
          department: formData.department,
          designation: formData.designation,
          phone: formData.phone,
          role: 'employee',
          assigned_shift: formData.shiftId,
          shift_id: formData.shiftId,
          shiftId: formData.shiftId,
          assigned_geofence: formData.locationId,
          location_id: formData.locationId,
          locationId: formData.locationId,
          status: 'Active',
          is_active: true,
          isActive: true,
          password_hash: formData.password || '2026',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('employees').upsert([newRecord]);

        if (error) {
          // Fallback minimal insert
          await supabase.from('employees').upsert([
            {
              id: newId,
              name: formData.name,
              email: formData.email,
              department: formData.department,
              role: 'employee',
              assigned_shift: formData.shiftId,
              assigned_geofence: formData.locationId,
              status: 'Active',
            },
          ]);
        }
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save employee record directly to Supabase.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove employee "${name}"?`)) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase.from('employees').delete().eq('id', id);
          if (error) {
            await supabase.from('employees').delete().eq('employee_id', id);
          }
        }
        await loadData();
      } catch (err) {
        alert('Failed to delete employee record.');
      }
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !departmentFilter || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Workforce Directory & Staff Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee accounts, assign work shifts, designate office geofence locations, and issue access credentials.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Employee
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading workforce records...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No employee records match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department & Role</th>
                  <th className="py-3.5 px-4">Assigned Shift</th>
                  <th className="py-3.5 px-4">Assigned Geofence</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredEmployees.map((emp) => {
                  const shift = shifts.find((s) => s.id === emp.shiftId);
                  const loc = locations.find((l) => l.id === emp.locationId);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">ID: {emp.employeeId} • {emp.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{emp.department}</p>
                        <p className="text-[11px] text-slate-500">{emp.designation}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{shift?.name || 'Standard Morning'}</span>
                        </div>
                        {shift && (
                          <p className="text-[10px] text-slate-400 pl-5">
                            {shift.startTime} - {shift.endTime} ({shift.gracePeriodMinutes}m grace)
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{loc?.name || 'Headquarters'}</span>
                        </div>
                        {loc && (
                          <p className="text-[10px] text-slate-400 pl-5">
                            Radius: {loc.radiusMeters}m
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Staff
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmployee ? 'Edit Employee Credentials' : 'Add New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs font-mono"
                    placeholder="e.g. EMP101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                    placeholder="employee@enterprise.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                    placeholder="Engineering"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Shift Schedule
                  </label>
                  <select
                    value={formData.shiftId}
                    onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime}-{s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Office Geofence
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.radiusMeters}m radius)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingEmployee ? 'Set New Password (Optional)' : 'Default Login Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                  placeholder={editingEmployee ? 'Leave empty to keep existing password' : 'Enter login password'}
                />
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
                  Save Employee Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
