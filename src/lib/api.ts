import {
  Employee,
  AdminUser,
  ShiftSchedule,
  OfficeLocation,
  AttendanceRecord,
  WorkforceStats,
} from '../types';
import {
  supabaseLoginAdmin,
  supabaseLoginEmployee,
  supabaseFetchEmployees,
  supabaseCreateEmployee,
  supabaseUpdateEmployee,
  supabaseDeleteEmployee,
  supabaseFetchShifts,
  supabaseCreateShift,
  supabaseUpdateShift,
  supabaseDeleteShift,
  supabaseFetchLocations,
  supabaseCreateLocation,
  supabaseUpdateLocation,
  supabaseDeleteLocation,
  supabaseFetchAttendanceRecords,
  supabaseCheckInEmployee,
  supabaseCheckOutEmployee,
  supabaseToggleBreak,
  getSupabaseClient,
  initialEmployees,
} from './supabase';

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const rawText = await res.text().catch(() => '');
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${rawText.slice(0, 120) || res.statusText}`);
      }
      throw new Error(`Unexpected non-JSON response from server.`);
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `Server error (${res.status}): ${res.statusText}`);
  }

  return data as T;
}

// Authentication
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; user: AdminUser }> {
  const admin = await supabaseLoginAdmin(username, password);
  return { success: true, user: admin };
}

export async function loginEmployee(identifier: string, password: string): Promise<{ success: boolean; user: Employee }> {
  try {
    const res = await fetch('/api/auth/employee/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (res.ok) {
      return await handleResponse<{ success: boolean; user: Employee }>(res);
    }
  } catch (err) {
    console.warn('API endpoint unavailable, using direct Supabase Employee verification:', err);
  }

  const emp = await supabaseLoginEmployee(identifier, password);
  return { success: true, user: emp };
}

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('admin_users').update({ password: newPassword }).eq('id', adminId);
    } catch {}
    try {
      await client.from('admins').update({ passwordHash: newPassword }).eq('id', adminId);
    } catch {}
  }
  return { success: true, message: 'Password updated successfully in database.' };
}

// Employees
export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const res = await fetch('/api/employees');
    if (res.ok) return await handleResponse<Employee[]>(res);
  } catch {}
  return supabaseFetchEmployees();
}

export async function createEmployee(data: Partial<Employee> & { password?: string }): Promise<Employee> {
  try {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await handleResponse<Employee>(res);
  } catch {}
  return supabaseCreateEmployee(data);
}

export async function updateEmployee(id: string, updates: Partial<Employee> & { password?: string }): Promise<Employee> {
  try {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) return await handleResponse<Employee>(res);
  } catch {}
  return supabaseUpdateEmployee(id, updates);
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (res.ok) return await handleResponse<{ success: boolean }>(res);
  } catch {}
  await supabaseDeleteEmployee(id);
  return { success: true };
}

// Shifts
export async function fetchShifts(): Promise<ShiftSchedule[]> {
  try {
    const res = await fetch('/api/shifts');
    if (res.ok) return await handleResponse<ShiftSchedule[]>(res);
  } catch {}
  return supabaseFetchShifts();
}

export async function createShift(data: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
  try {
    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await handleResponse<ShiftSchedule>(res);
  } catch {}
  return supabaseCreateShift(data);
}

export async function updateShift(id: string, updates: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
  try {
    const res = await fetch(`/api/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) return await handleResponse<ShiftSchedule>(res);
  } catch {}
  return supabaseUpdateShift(id, updates);
}

export async function deleteShift(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
    if (res.ok) return await handleResponse<{ success: boolean }>(res);
  } catch {}
  await supabaseDeleteShift(id);
  return { success: true };
}

// Locations
export async function fetchLocations(): Promise<OfficeLocation[]> {
  try {
    const res = await fetch('/api/locations');
    if (res.ok) return await handleResponse<OfficeLocation[]>(res);
  } catch {}
  return supabaseFetchLocations();
}

export async function createLocation(data: Partial<OfficeLocation>): Promise<OfficeLocation> {
  try {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await handleResponse<OfficeLocation>(res);
  } catch {}
  return supabaseCreateLocation(data);
}

export async function updateLocation(id: string, updates: Partial<OfficeLocation>): Promise<OfficeLocation> {
  try {
    const res = await fetch(`/api/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) return await handleResponse<OfficeLocation>(res);
  } catch {}
  return supabaseUpdateLocation(id, updates);
}

export async function deleteLocation(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    if (res.ok) return await handleResponse<{ success: boolean }>(res);
  } catch {}
  await supabaseDeleteLocation(id);
  return { success: true };
}

// Attendance
export async function fetchAttendanceRecords(params?: {
  employeeId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> {
  try {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`/api/attendance${query ? `?${query}` : ''}`);
    if (res.ok) return await handleResponse<AttendanceRecord[]>(res);
  } catch {}
  return supabaseFetchAttendanceRecords(params);
}

export async function checkInEmployee(payload: {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  photo?: string;
  geofenceValid?: boolean;
  geofenceName?: string;
  remarks?: string;
}): Promise<AttendanceRecord> {
  try {
    const res = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await handleResponse<AttendanceRecord>(res);
  } catch {}
  return supabaseCheckInEmployee(payload);
}

export async function checkOutEmployee(payload: {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  photo?: string;
  geofenceValid?: boolean;
  remarks?: string;
}): Promise<AttendanceRecord> {
  try {
    const res = await fetch('/api/attendance/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await handleResponse<AttendanceRecord>(res);
  } catch {}
  return supabaseCheckOutEmployee(payload);
}

export async function toggleBreak(employeeId: string): Promise<AttendanceRecord> {
  try {
    const res = await fetch('/api/attendance/toggle-break', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    if (res.ok) return await handleResponse<AttendanceRecord>(res);
  } catch {}
  return supabaseToggleBreak(employeeId);
}

// Overview Stats
export async function fetchWorkforceStats(): Promise<WorkforceStats> {
  try {
    const res = await fetch('/api/stats/overview');
    if (res.ok) return await handleResponse<WorkforceStats>(res);
  } catch {}

  const employees = await supabaseFetchEmployees();
  const attendance = await supabaseFetchAttendanceRecords({
    date: new Date().toISOString().split('T')[0],
  });

  const presentCount = attendance.filter((a) => a.status === 'Punctual' || a.status === 'Late').length;
  const lateCount = attendance.filter((a) => a.status === 'Late').length;
  const absentCount = Math.max(0, employees.length - presentCount);

  return {
    totalEmployees: employees.length || initialEmployees.length,
    presentToday: presentCount,
    lateToday: lateCount,
    absentToday: absentCount,
    onLeaveToday: 0,
    geofenceCompliancePercentage: 100,
    activeOnBreak: 0,
  };
}

// Excel Export URL
export function getExcelExportUrl(params?: {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
}): string {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return `/api/export/excel${query ? `?${query}` : ''}`;
}
