export type UserRole = 'admin' | 'employee';

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 150m
  requiredAccuracyMeters: number; // e.g. 50m
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSchedule {
  id: string;
  name: string; // e.g., "Standard Morning", "Evening Shift"
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  gracePeriodMinutes: number; // e.g., 15
  allowedBreakMinutes: number; // e.g., 60
  overtimeThresholdMinutes: number; // e.g., 480 (8 hours)
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId: string; // Unique string e.g., "EMP101"
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  role: UserRole;
  shiftId: string;
  locationId: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface BreakLog {
  id: string;
  breakStart: string; // ISO string
  breakEnd?: string; // ISO string
  durationMinutes?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  checkInLat?: number;
  checkInLng?: number;
  checkInAccuracy?: number;
  checkInPhoto?: string; // Base64 or image URL
  checkInGeofenceValid?: boolean;
  checkInGeofenceName?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutAccuracy?: number;
  checkOutPhoto?: string;
  checkOutGeofenceValid?: boolean;
  breaks: BreakLog[];
  totalBreakMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  status: 'Punctual' | 'Late' | 'Early Checkout' | 'Absent' | 'On Leave';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkforceStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  geofenceCompliancePercentage: number;
  activeOnBreak: number;
}
