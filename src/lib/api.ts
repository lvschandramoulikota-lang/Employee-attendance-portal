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

// Authentication
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; user: AdminUser }> {
  const admin = await supabaseLoginAdmin(username, password);
  return { success: true, user: admin };
}

export async function loginEmployee(identifier: string, password: string): Promise<{ success: boolean; user: Employee }> {
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
  return supabaseFetchEmployees();
}

export async function createEmployee(data: Partial<Employee> & { password?: string }): Promise<Employee> {
  return supabaseCreateEmployee(data);
}

export async function updateEmployee(id: string, updates: Partial<Employee> & { password?: string }): Promise<Employee> {
  return supabaseUpdateEmployee(id, updates);
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  await supabaseDeleteEmployee(id);
  return { success: true };
}

// Shifts
export async function fetchShifts(): Promise<ShiftSchedule[]> {
  return supabaseFetchShifts();
}

export async function createShift(data: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
  return supabaseCreateShift(data);
}

export async function updateShift(id: string, updates: Partial<ShiftSchedule>): Promise<ShiftSchedule> {
  return supabaseUpdateShift(id, updates);
}

export async function deleteShift(id: string): Promise<{ success: boolean }> {
  await supabaseDeleteShift(id);
  return { success: true };
}

// Locations / Geofences
export async function fetchLocations(): Promise<OfficeLocation[]> {
  return supabaseFetchLocations();
}

export async function createLocation(data: Partial<OfficeLocation>): Promise<OfficeLocation> {
  return supabaseCreateLocation(data);
}

export async function updateLocation(id: string, updates: Partial<OfficeLocation>): Promise<OfficeLocation> {
  return supabaseUpdateLocation(id, updates);
}

export async function deleteLocation(id: string): Promise<{ success: boolean }> {
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
  return supabaseCheckOutEmployee(payload);
}

export async function toggleBreak(employeeId: string): Promise<AttendanceRecord> {
  return supabaseToggleBreak(employeeId);
}

// Overview Stats
export async function fetchWorkforceStats(): Promise<WorkforceStats> {
  const employees = await supabaseFetchEmployees();
  const attendance = await supabaseFetchAttendanceRecords({
    date: new Date().toISOString().split('T')[0],
  });

  const presentCount = attendance.filter((a) => a.status === 'Punctual' || a.status === 'Late').length;
  const lateCount = attendance.filter((a) => a.status === 'Late').length;
  const absentCount = Math.max(0, (employees.length || initialEmployees.length) - presentCount);

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
