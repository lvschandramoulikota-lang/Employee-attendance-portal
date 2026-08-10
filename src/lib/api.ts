import {
  Employee,
  AdminUser,
  ShiftSchedule,
  OfficeLocation,
  AttendanceRecord,
  WorkforceStats,
} from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'An unexpected server error occurred.');
  }
  return data as T;
}

// Authentication
export async function loginEmployee(identifier: string, password: string) {
  const res = await fetch('/api/auth/employee/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  return handleResponse<{ success: boolean; user: Employee }>(res);
}

export async function loginAdmin(username: string, password: string) {
  const res = await fetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<{ success: boolean; user: AdminUser }>(res);
}

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
) {
  const res = await fetch('/api/auth/admin/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId, currentPassword, newPassword }),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}

// Employees
export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees');
  return handleResponse<Employee[]>(res);
}

export async function createEmployee(data: Partial<Employee> & { password?: string }): Promise<Employee> {
  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Employee>(res);
}

export async function updateEmployee(id: string, updates: Partial<Employee> & { password?: string }): Promise<Employee> {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleResponse<Employee>(res);
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
  return handleResponse<{ success: boolean }>(res);
}

// Shifts
export async function fetchShifts(): Promise<ShiftSchedule[]> {
  const res = await fetch('/api/shifts');
  return handleResponse<ShiftSchedule[]>(res);
}

export async function createShift(data: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
  const res = await fetch('/api/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ShiftSchedule>(res);
}

export async function updateShift(id: string, updates: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
  const res = await fetch(`/api/shifts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleResponse<ShiftSchedule>(res);
}

export async function deleteShift(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
  return handleResponse<{ success: boolean }>(res);
}

// Locations
export async function fetchLocations(): Promise<OfficeLocation[]> {
  const res = await fetch('/api/locations');
  return handleResponse<OfficeLocation[]>(res);
}

export async function createLocation(data: Partial<OfficeLocation>): Promise<OfficeLocation> {
  const res = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<OfficeLocation>(res);
}

export async function updateLocation(id: string, updates: Partial<OfficeLocation>): Promise<OfficeLocation> {
  const res = await fetch(`/api/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleResponse<OfficeLocation>(res);
}

export async function deleteLocation(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
  return handleResponse<{ success: boolean }>(res);
}

// Attendance
export async function fetchAttendanceRecords(params?: {
  employeeId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceRecord[]> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`/api/attendance${query ? `?${query}` : ''}`);
  return handleResponse<AttendanceRecord[]>(res);
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
  const res = await fetch('/api/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AttendanceRecord>(res);
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
  const res = await fetch('/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AttendanceRecord>(res);
}

export async function toggleBreak(employeeId: string): Promise<AttendanceRecord> {
  const res = await fetch('/api/attendance/toggle-break', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return handleResponse<AttendanceRecord>(res);
}

// Overview Stats
export async function fetchWorkforceStats(): Promise<WorkforceStats> {
  const res = await fetch('/api/stats/overview');
  return handleResponse<WorkforceStats>(res);
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
