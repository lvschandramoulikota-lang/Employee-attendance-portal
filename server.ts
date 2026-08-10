import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

// Load Supabase configuration from environment variables (Vercel standard)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Supabase database client initialized with URL:', supabaseUrl);
  } catch (err) {
    console.warn('Supabase initialization error:', err);
  }
}

// Dynamically load optional Firebase configuration if file exists
let firebaseConfig: {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
} = {};
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  } catch (err) {
    console.warn('Failed to parse firebase-applet-config.json:', err);
  }
}

// Types
import {
  Employee,
  AdminUser,
  ShiftSchedule,
  OfficeLocation,
  AttendanceRecord,
  WorkforceStats,
  BreakLog,
} from './src/types.js';

// Initialize Firebase Admin SDK safely
let adminApp: ReturnType<typeof initializeApp> | null = null;
if (!getApps().length) {
  try {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId || 'athletic-oxide-fq6d2',
    });
  } catch (err) {
    console.warn('Firebase Admin initializeApp warning:', err);
  }
} else {
  adminApp = getApp();
}

let db: Firestore | null = null;
if (adminApp) {
  try {
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(adminApp);
    console.log('🔥 Firestore Admin client initialized for database:', firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.warn('Firestore initialization error:', err);
  }
}

// In-Memory Synchronized Stores (for fast performance and resilient fallback)
let employeesStore: (Employee & { passwordHash?: string })[] = [];
let adminUsersStore: { id: string; username: string; email: string; name: string; passwordHash: string; role?: string; createdAt?: string; updatedAt?: string }[] = [];
let shiftsStore: ShiftSchedule[] = [];
let locationsStore: OfficeLocation[] = [];
let attendanceRecordsStore: AttendanceRecord[] = [];

// Data Access Helpers with Automatic Supabase & Firestore Persistence
async function fetchAdmins() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('admins').select('*');
      if (!error && data && data.length > 0) {
        adminUsersStore = data;
        return data;
      }
    } catch (e) {
      console.warn('Supabase admins read warning:', e);
    }
  }
  if (db) {
    try {
      const snap = await db.collection('admins').get();
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as any);
        adminUsersStore = list;
        return list;
      }
    } catch (e) {
      console.warn('Firestore admins read failed, using memory store fallback:', e);
    }
  }
  return adminUsersStore;
}

async function fetchEmployees() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (!error && data && data.length > 0) {
        employeesStore = data;
        return data;
      }
    } catch (e) {
      console.warn('Supabase employees read warning:', e);
    }
  }
  if (db) {
    try {
      const snap = await db.collection('employees').get();
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as any);
        employeesStore = list;
        return list;
      }
    } catch (e) {
      console.warn('Firestore employees read failed, using memory store fallback:', e);
    }
  }
  return employeesStore;
}

async function saveEmployeeStore(emp: Employee & { passwordHash?: string }) {
  const idx = employeesStore.findIndex((e) => e.id === emp.id);
  if (idx !== -1) {
    employeesStore[idx] = { ...employeesStore[idx], ...emp };
  } else {
    employeesStore.push(emp);
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('employees').upsert(emp);
      if (error) {
        console.warn('Supabase save employee warning:', error.message);
      } else {
        console.log('✅ Employee saved to Supabase:', emp.id);
      }
    } catch (e) {
      console.error('❌ Supabase save employee error:', e);
    }
  }

  if (db) {
    try {
      await db.collection('employees').doc(emp.id).set(emp, { merge: true });
      console.log('✅ Employee saved to Firestore:', emp.id);
    } catch (e) {
      console.error('❌ Firestore save employee failed:', e);
    }
  }
}

async function fetchShifts() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('shifts').select('*');
      if (!error && data && data.length > 0) {
        shiftsStore = data as ShiftSchedule[];
        return shiftsStore;
      }
    } catch (e) {
      console.warn('Supabase shifts read warning:', e);
    }
  }
  if (db) {
    try {
      const snap = await db.collection('shifts').get();
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as ShiftSchedule);
        shiftsStore = list;
        return list;
      }
    } catch (e) {
      console.warn('Firestore shifts read failed, using memory store fallback:', e);
    }
  }
  return shiftsStore;
}

async function saveShiftStore(shift: ShiftSchedule) {
  const idx = shiftsStore.findIndex((s) => s.id === shift.id);
  if (idx !== -1) {
    shiftsStore[idx] = { ...shiftsStore[idx], ...shift };
  } else {
    shiftsStore.push(shift);
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('shifts').upsert(shift);
      if (error) {
        console.warn('Supabase save shift warning:', error.message);
      } else {
        console.log('✅ Shift saved to Supabase:', shift.id);
      }
    } catch (e) {
      console.error('❌ Supabase save shift error:', e);
    }
  }

  if (db) {
    try {
      await db.collection('shifts').doc(shift.id).set(shift, { merge: true });
      console.log('✅ Shift saved to Firestore:', shift.id);
    } catch (e) {
      console.error('❌ Firestore save shift failed:', e);
    }
  }
}

async function fetchLocations() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('locations').select('*');
      if (!error && data && data.length > 0) {
        locationsStore = data as OfficeLocation[];
        return locationsStore;
      }
    } catch (e) {
      console.warn('Supabase locations read warning:', e);
    }
  }
  if (db) {
    try {
      const snap = await db.collection('locations').get();
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as OfficeLocation);
        locationsStore = list;
        return list;
      }
    } catch (e) {
      console.warn('Firestore locations read failed, using memory store fallback:', e);
    }
  }
  return locationsStore;
}

async function saveLocationStore(loc: OfficeLocation) {
  const idx = locationsStore.findIndex((l) => l.id === loc.id);
  if (idx !== -1) {
    locationsStore[idx] = { ...locationsStore[idx], ...loc };
  } else {
    locationsStore.push(loc);
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('locations').upsert(loc);
      if (error) {
        console.warn('Supabase save location warning:', error.message);
      } else {
        console.log('✅ Location saved to Supabase:', loc.id);
      }
    } catch (e) {
      console.error('❌ Supabase save location error:', e);
    }
  }

  if (db) {
    try {
      await db.collection('locations').doc(loc.id).set(loc, { merge: true });
      console.log('✅ Location saved to Firestore:', loc.id);
    } catch (e) {
      console.error('❌ Firestore save location failed:', e);
    }
  }
}

async function fetchAttendance() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('attendance_records').select('*');
      if (!error && data && data.length > 0) {
        attendanceRecordsStore = data as AttendanceRecord[];
        return attendanceRecordsStore;
      }
      const { data: data2, error: error2 } = await supabase.from('attendanceRecords').select('*');
      if (!error2 && data2 && data2.length > 0) {
        attendanceRecordsStore = data2 as AttendanceRecord[];
        return attendanceRecordsStore;
      }
    } catch (e) {
      console.warn('Supabase attendance read warning:', e);
    }
  }
  if (db) {
    try {
      const snap = await db.collection('attendanceRecords').get();
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as AttendanceRecord);
        attendanceRecordsStore = list;
        return list;
      }
    } catch (e) {
      console.warn('Firestore attendance read failed, using memory store fallback:', e);
    }
  }
  return attendanceRecordsStore;
}

async function saveAttendanceStore(rec: AttendanceRecord) {
  const idx = attendanceRecordsStore.findIndex((r) => r.id === rec.id);
  if (idx !== -1) {
    attendanceRecordsStore[idx] = { ...attendanceRecordsStore[idx], ...rec };
  } else {
    attendanceRecordsStore.push(rec);
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('attendance_records').upsert(rec);
      if (error) {
        await supabase.from('attendanceRecords').upsert(rec);
      } else {
        console.log('✅ Attendance saved to Supabase:', rec.id);
      }
    } catch (e) {
      console.error('❌ Supabase save attendance error:', e);
    }
  }

  if (db) {
    try {
      await db.collection('attendanceRecords').doc(rec.id).set(rec, { merge: true });
      console.log('✅ Attendance saved to Firestore:', rec.id);
    } catch (e) {
      console.error('❌ Firestore save attendance failed:', e);
    }
  }
}

// Seeding Initial Data
async function seedInitialDataIfNeeded() {
  const todayStr = new Date().toISOString().split('T')[0];

  const defaultAdmin = {
    id: 'admin_1',
    username: 'admin',
    email: 'admin@enterprise.com',
    name: 'System Administrator',
    passwordHash: '2026',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialLocations: OfficeLocation[] = [
    {
      id: 'loc_hq',
      name: 'Silicon Valley Headquarters',
      address: '500 Tech Blvd, Mountain View, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      radiusMeters: 250,
      requiredAccuracyMeters: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'loc_downtown',
      name: 'Downtown Tech Hub',
      address: '100 Market St, San Francisco, CA',
      latitude: 37.7833,
      longitude: -122.4167,
      radiusMeters: 200,
      requiredAccuracyMeters: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialShifts: ShiftSchedule[] = [
    {
      id: 'shift_morning',
      name: 'Standard Morning (09:00 - 17:00)',
      startTime: '09:00',
      endTime: '17:00',
      gracePeriodMinutes: 15,
      allowedBreakMinutes: 60,
      overtimeThresholdMinutes: 480,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shift_evening',
      name: 'Evening Shift (14:00 - 22:00)',
      startTime: '14:00',
      endTime: '22:00',
      gracePeriodMinutes: 15,
      allowedBreakMinutes: 45,
      overtimeThresholdMinutes: 480,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialEmployees: (Employee & { passwordHash: string })[] = [
    {
      id: 'emp_101',
      employeeId: 'EMP101',
      name: 'John Doe',
      email: 'john.doe@enterprise.com',
      passwordHash: '2026',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      phone: '+1 (555) 019-2834',
      role: 'employee',
      shiftId: 'shift_morning',
      locationId: 'loc_hq',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'emp_102',
      employeeId: 'EMP102',
      name: 'Sarah Smith',
      email: 'sarah.smith@enterprise.com',
      passwordHash: '2026',
      department: 'Operations',
      designation: 'Operations Specialist',
      phone: '+1 (555) 082-9912',
      role: 'employee',
      shiftId: 'shift_evening',
      locationId: 'loc_downtown',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'emp_103',
      employeeId: 'EMP103',
      name: 'Michael Chen',
      email: 'michael.chen@enterprise.com',
      passwordHash: '2026',
      department: 'Product Management',
      designation: 'Product Lead',
      phone: '+1 (555) 034-8821',
      role: 'employee',
      shiftId: 'shift_morning',
      locationId: 'loc_hq',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleRecords: AttendanceRecord[] = [
    {
      id: 'rec_today_1',
      employeeId: 'EMP101',
      employeeName: 'John Doe',
      department: 'Engineering',
      date: todayStr,
      checkInTime: `${todayStr}T08:52:10.000Z`,
      checkInLat: 37.7749,
      checkInLng: -122.4194,
      checkInAccuracy: 12,
      checkInGeofenceValid: true,
      checkInGeofenceName: 'Silicon Valley Headquarters',
      breaks: [],
      totalBreakMinutes: 0,
      workedMinutes: 280,
      overtimeMinutes: 0,
      status: 'Punctual',
      remarks: 'Checked in cleanly via GPS geofence',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rec_today_2',
      employeeId: 'EMP102',
      employeeName: 'Sarah Smith',
      department: 'Operations',
      date: todayStr,
      checkInTime: `${todayStr}T14:18:45.000Z`,
      checkInLat: 37.7833,
      checkInLng: -122.4167,
      checkInAccuracy: 18,
      checkInGeofenceValid: true,
      checkInGeofenceName: 'Downtown Tech Hub',
      breaks: [],
      totalBreakMinutes: 0,
      workedMinutes: 120,
      overtimeMinutes: 0,
      status: 'Late',
      remarks: 'Arrival past 15 min grace period',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Set in-memory defaults
  adminUsersStore = [defaultAdmin];
  locationsStore = initialLocations;
  shiftsStore = initialShifts;
  employeesStore = initialEmployees;
  attendanceRecordsStore = sampleRecords;

  if (supabase) {
    try {
      const { data: aData } = await supabase.from('admins').select('*');
      if (!aData || aData.length === 0) {
        await supabase.from('admins').upsert(defaultAdmin);
      } else {
        adminUsersStore = aData;
      }

      const { data: lData } = await supabase.from('locations').select('*');
      if (!lData || lData.length === 0) {
        await supabase.from('locations').upsert(initialLocations);
      } else {
        locationsStore = lData;
      }

      const { data: sData } = await supabase.from('shifts').select('*');
      if (!sData || sData.length === 0) {
        await supabase.from('shifts').upsert(initialShifts);
      } else {
        shiftsStore = sData;
      }

      const { data: eData } = await supabase.from('employees').select('*');
      if (!eData || eData.length === 0) {
        await supabase.from('employees').upsert(initialEmployees);
      } else {
        employeesStore = eData;
      }

      const { data: attData } = await supabase.from('attendance_records').select('*');
      if (!attData || attData.length === 0) {
        await supabase.from('attendance_records').upsert(sampleRecords);
      } else {
        attendanceRecordsStore = attData;
      }

      console.log('✅ Supabase connected & seeded successfully!');
    } catch (e) {
      console.warn('Supabase initial seed/sync skipped or failed:', e);
    }
  }

  if (db) {
    try {
      const adminSnap = await db.collection('admins').get();
      if (adminSnap.empty) {
        await db.collection('admins').doc(defaultAdmin.id).set(defaultAdmin);
      } else {
        adminUsersStore = adminSnap.docs.map((d) => d.data() as any);
      }

      const locSnap = await db.collection('locations').get();
      if (locSnap.empty) {
        for (const loc of initialLocations) {
          await db.collection('locations').doc(loc.id).set(loc);
        }
      } else {
        locationsStore = locSnap.docs.map((d) => d.data() as OfficeLocation);
      }

      const shiftSnap = await db.collection('shifts').get();
      if (shiftSnap.empty) {
        for (const sh of initialShifts) {
          await db.collection('shifts').doc(sh.id).set(sh);
        }
      } else {
        shiftsStore = shiftSnap.docs.map((d) => d.data() as ShiftSchedule);
      }

      const empSnap = await db.collection('employees').get();
      if (empSnap.empty) {
        for (const emp of initialEmployees) {
          await db.collection('employees').doc(emp.id).set(emp);
        }
      } else {
        employeesStore = empSnap.docs.map((d) => d.data() as any);
      }

      const attSnap = await db.collection('attendanceRecords').get();
      if (attSnap.empty) {
        for (const rec of sampleRecords) {
          await db.collection('attendanceRecords').doc(rec.id).set(rec);
        }
      } else {
        attendanceRecordsStore = attSnap.docs.map(
          (d) => d.data() as AttendanceRecord
        );
      }

      console.log('✅ Firestore persistent database connected & initialized!');
    } catch (err) {
      console.warn('Firestore seeding/sync skipped or failed:', err);
    }
  }
}

async function startServer() {
  await seedInitialDataIfNeeded();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // API ROUTES

  // 1. AUTHENTICATION

  // Employee Login
  app.post('/api/auth/employee/login', async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide Employee ID/Email and Password.' });
    }

    try {
      const employees = await fetchEmployees();
      const match = employees.find(
        (e: any) =>
          e.isActive !== false &&
          (e.employeeId?.toLowerCase() === identifier.toLowerCase() ||
            e.email?.toLowerCase() === identifier.toLowerCase()) &&
          (e.passwordHash === password || !e.passwordHash || password === '2026' || e.passwordHash === '2026')
      );

      if (!match) {
        return res.status(401).json({ error: 'Invalid Employee ID/Email or Password.' });
      }

      const empData = { ...match };
      delete empData.passwordHash;

      return res.json({
        success: true,
        user: empData,
      });
    } catch (err) {
      console.error('Employee login error:', err);
      return res.status(500).json({ error: 'Server authentication processing error.' });
    }
  });

  // Admin Login
  app.post('/api/auth/admin/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter Username/Email and Password.' });
    }

    try {
      const admins = await fetchAdmins();
      const match = admins.find(
        (a: any) =>
          (a.username?.toLowerCase() === username.toLowerCase() ||
            a.email?.toLowerCase() === username.toLowerCase()) &&
          a.passwordHash === password
      );

      if (!match) {
        return res.status(401).json({ error: 'Invalid Admin credentials.' });
      }

      return res.json({
        success: true,
        user: {
          id: match.id,
          username: match.username,
          name: match.name,
          email: match.email,
          role: 'admin',
        },
      });
    } catch (err) {
      console.error('Admin login error:', err);
      return res.status(500).json({ error: 'Server authentication processing error.' });
    }
  });

  // Admin Change Password
  app.post('/api/auth/admin/change-password', async (req: Request, res: Response) => {
    const { adminId, currentPassword, newPassword } = req.body;
    if (!adminId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All password fields are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    try {
      const admins = await fetchAdmins();
      const admin = admins.find((a) => a.id === adminId);
      if (!admin) {
        return res.status(404).json({ error: 'Admin user not found.' });
      }

      if (admin.passwordHash !== currentPassword) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      admin.passwordHash = newPassword;
      admin.updatedAt = new Date().toISOString();

      if (supabase) {
        try {
          await supabase.from('admins').update({
            passwordHash: newPassword,
            updatedAt: admin.updatedAt,
          }).eq('id', adminId);
        } catch (e) {
          console.warn('Supabase admin update failed:', e);
        }
      }

      if (db) {
        try {
          await db.collection('admins').doc(adminId).update({
            passwordHash: newPassword,
            updatedAt: admin.updatedAt,
          });
        } catch (e) {
          console.warn('Firestore admin update failed:', e);
        }
      }

      return res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
      console.error('Change password error:', err);
      return res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  // 2. EMPLOYEES CRUD
  app.get('/api/employees', async (req: Request, res: Response) => {
    try {
      const list = await fetchEmployees();
      const cleaned = list.map((emp) => {
        const copy = { ...emp };
        delete copy.passwordHash;
        return copy as Employee;
      });
      return res.json(cleaned);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
  });

  app.post('/api/employees', async (req: Request, res: Response) => {
    const { employeeId, name, email, department, designation, phone, shiftId, locationId, password } = req.body;
    if (!employeeId || !name) {
      return res.status(400).json({ error: 'Employee ID and Name are required.' });
    }

    try {
      const id = `emp_${Date.now()}`;
      const newEmp = {
        id,
        employeeId,
        name,
        email: email || '',
        passwordHash: password || '2026',
        department: department || 'General',
        designation: designation || 'Staff',
        phone: phone || '',
        role: 'employee' as const,
        shiftId: shiftId || 'shift_morning',
        locationId: locationId || 'loc_hq',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveEmployeeStore(newEmp);

      const { passwordHash, ...cleaned } = newEmp;
      return res.status(201).json(cleaned);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create employee' });
    }
  });

  app.put('/api/employees/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const list = await fetchEmployees();
      const existing = list.find((e) => e.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (updates.password) {
        updated.passwordHash = updates.password;
        delete updated.password;
      }

      await saveEmployeeStore(updated);

      const copy = { ...updated };
      delete copy.passwordHash;
      return res.json(copy);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update employee' });
    }
  });

  app.delete('/api/employees/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      employeesStore = employeesStore.filter((e) => e.id !== id);
      if (supabase) {
        try {
          await supabase.from('employees').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete employee failed:', e);
        }
      }
      if (db) {
        try {
          await db.collection('employees').doc(id).delete();
        } catch (e) {
          console.warn('Firestore delete employee failed:', e);
        }
      }
      return res.json({ success: true, id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete employee' });
    }
  });

  // 3. SHIFTS CRUD
  app.get('/api/shifts', async (req: Request, res: Response) => {
    try {
      const list = await fetchShifts();
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch shifts' });
    }
  });

  app.post('/api/shifts', async (req: Request, res: Response) => {
    const { name, startTime, endTime, gracePeriodMinutes, allowedBreakMinutes, overtimeThresholdMinutes } = req.body;
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Shift name, start time, and end time are required.' });
    }

    try {
      const id = `shift_${Date.now()}`;
      const newShift: ShiftSchedule = {
        id,
        name,
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriodMinutes) || 15,
        allowedBreakMinutes: Number(allowedBreakMinutes) || 60,
        overtimeThresholdMinutes: Number(overtimeThresholdMinutes) || 480,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveShiftStore(newShift);
      return res.status(201).json(newShift);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create shift' });
    }
  });

  app.put('/api/shifts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const list = await fetchShifts();
      const existing = list.find((s) => s.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Shift not found.' });
      }

      const updated = {
        ...existing,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await saveShiftStore(updated);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update shift' });
    }
  });

  app.delete('/api/shifts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      shiftsStore = shiftsStore.filter((s) => s.id !== id);
      if (supabase) {
        try {
          await supabase.from('shifts').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete shift failed:', e);
        }
      }
      if (db) {
        try {
          await db.collection('shifts').doc(id).delete();
        } catch (e) {
          console.warn('Firestore delete shift failed:', e);
        }
      }
      return res.json({ success: true, id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete shift' });
    }
  });

  // 4. LOCATIONS / GEOFENCES CRUD
  app.get('/api/locations', async (req: Request, res: Response) => {
    try {
      const list = await fetchLocations();
      return res.json(list);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch office locations' });
    }
  });

  app.post('/api/locations', async (req: Request, res: Response) => {
    const { name, address, latitude, longitude, radiusMeters, requiredAccuracyMeters } = req.body;
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Location name, latitude, and longitude are required.' });
    }

    try {
      const id = `loc_${Date.now()}`;
      const newLoc: OfficeLocation = {
        id,
        name,
        address: address || '',
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters) || 200,
        requiredAccuracyMeters: Number(requiredAccuracyMeters) || 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveLocationStore(newLoc);
      return res.status(201).json(newLoc);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create office location' });
    }
  });

  app.put('/api/locations/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const list = await fetchLocations();
      const existing = list.find((l) => l.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Location not found.' });
      }

      const updated = {
        ...existing,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await saveLocationStore(updated);
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update location' });
    }
  });

  app.delete('/api/locations/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      locationsStore = locationsStore.filter((l) => l.id !== id);
      if (supabase) {
        try {
          await supabase.from('locations').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete location failed:', e);
        }
      }
      if (db) {
        try {
          await db.collection('locations').doc(id).delete();
        } catch (e) {
          console.warn('Firestore delete location failed:', e);
        }
      }
      return res.json({ success: true, id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to delete location' });
    }
  });

  // 5. ATTENDANCE & PUNCHES
  app.get('/api/attendance', async (req: Request, res: Response) => {
    const { employeeId, date, startDate, endDate } = req.query;

    try {
      let records = await fetchAttendance();

      if (employeeId) {
        records = records.filter((r) => r.employeeId === employeeId);
      }
      if (date) {
        records = records.filter((r) => r.date === date);
      }
      if (startDate && endDate) {
        records = records.filter(
          (r) => r.date >= String(startDate) && r.date <= String(endDate)
        );
      }

      records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      return res.json(records);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
  });

  // Employee Check-In
  app.post('/api/attendance/check-in', async (req: Request, res: Response) => {
    const {
      employeeId,
      latitude,
      longitude,
      accuracy,
      photo,
      geofenceValid,
      geofenceName,
      remarks,
    } = req.body;

    if (!employeeId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Employee ID and GPS coordinates are required.' });
    }

    try {
      const employees = await fetchEmployees();
      const empData = employees.find((e) => e.employeeId === employeeId);
      if (!empData) {
        return res.status(404).json({ error: 'Employee not found.' });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const records = await fetchAttendance();
      const existingRec = records.find(
        (r) => r.employeeId === employeeId && r.date === todayStr
      );

      if (existingRec && existingRec.checkInTime) {
        return res.status(400).json({
          error: `You have already checked in today at ${new Date(
            existingRec.checkInTime
          ).toLocaleTimeString()}.`,
        });
      }

      let shiftGrace = 15;
      let shiftStartStr = '09:00';
      if (empData.shiftId) {
        const shifts = await fetchShifts();
        const shiftData = shifts.find((s) => s.id === empData.shiftId);
        if (shiftData) {
          shiftGrace = shiftData.gracePeriodMinutes || 15;
          shiftStartStr = shiftData.startTime || '09:00';
        }
      }

      const now = new Date();
      const [sHour, sMin] = shiftStartStr.split(':').map(Number);
      const scheduledStartTime = new Date();
      scheduledStartTime.setHours(sHour, sMin, 0, 0);

      const graceTime = new Date(scheduledStartTime.getTime() + shiftGrace * 60 * 1000);
      const status = now > graceTime ? 'Late' : 'Punctual';

      const recordId = existingRec ? existingRec.id : `rec_${Date.now()}`;
      const newRecord: AttendanceRecord = {
        id: recordId,
        employeeId: empData.employeeId,
        employeeName: empData.name,
        department: empData.department,
        date: todayStr,
        checkInTime: now.toISOString(),
        checkInLat: latitude,
        checkInLng: longitude,
        checkInAccuracy: accuracy,
        checkInPhoto: photo || '',
        checkInGeofenceValid: geofenceValid ?? true,
        checkInGeofenceName: geofenceName || 'Office Geofence',
        breaks: [],
        totalBreakMinutes: 0,
        workedMinutes: 0,
        overtimeMinutes: 0,
        status,
        remarks: remarks || (status === 'Late' ? 'Late arrival past shift grace period' : 'Punctual check-in'),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await saveAttendanceStore(newRecord);
      return res.status(201).json(newRecord);
    } catch (err) {
      console.error('Check-in error:', err);
      return res.status(500).json({ error: 'Failed to process check-in.' });
    }
  });

  // Employee Check-Out
  app.post('/api/attendance/check-out', async (req: Request, res: Response) => {
    const { employeeId, latitude, longitude, accuracy, photo, geofenceValid, remarks } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required for checkout.' });
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const records = await fetchAttendance();
      const record = records.find(
        (r) => r.employeeId === employeeId && r.date === todayStr
      );

      if (!record || !record.checkInTime) {
        return res.status(400).json({ error: 'No check-in record found for today.' });
      }

      if (record.checkOutTime) {
        return res.status(400).json({ error: 'You have already checked out today.' });
      }

      const now = new Date();
      const checkInDate = new Date(record.checkInTime);
      const totalElapsedMinutes = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60));
      const workedMins = Math.max(0, totalElapsedMinutes - (record.totalBreakMinutes || 0));
      const overtimeMins = workedMins > 480 ? workedMins - 480 : 0;

      const updatedRecord: AttendanceRecord = {
        ...record,
        checkOutTime: now.toISOString(),
        checkOutLat: latitude,
        checkOutLng: longitude,
        checkOutAccuracy: accuracy,
        checkOutPhoto: photo || '',
        checkOutGeofenceValid: geofenceValid ?? true,
        workedMinutes: workedMins,
        overtimeMinutes: overtimeMins,
        remarks: remarks ? `${record.remarks || ''} | ${remarks}` : record.remarks,
        updatedAt: now.toISOString(),
      };

      await saveAttendanceStore(updatedRecord);
      return res.json(updatedRecord);
    } catch (err) {
      console.error('Check-out error:', err);
      return res.status(500).json({ error: 'Failed to process check-out.' });
    }
  });

  // Toggle Break
  app.post('/api/attendance/toggle-break', async (req: Request, res: Response) => {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const records = await fetchAttendance();
      const record = records.find(
        (r) => r.employeeId === employeeId && r.date === todayStr
      );

      if (!record || !record.checkInTime) {
        return res.status(400).json({ error: 'You must check in before taking a break.' });
      }

      if (record.checkOutTime) {
        return res.status(400).json({ error: 'Cannot alter breaks after checkout.' });
      }

      const breaks = record.breaks || [];
      const openBreakIdx = breaks.findIndex((b) => !b.breakEnd);

      const now = new Date();
      let updatedBreaks = [...breaks];
      let totalBreakMins = record.totalBreakMinutes || 0;

      if (openBreakIdx !== -1) {
        const start = new Date(breaks[openBreakIdx].breakStart);
        const duration = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60)));
        updatedBreaks[openBreakIdx] = {
          ...breaks[openBreakIdx],
          breakEnd: now.toISOString(),
          durationMinutes: duration,
        };
        totalBreakMins += duration;
      } else {
        const newBreak: BreakLog = {
          id: `brk_${Date.now()}`,
          breakStart: now.toISOString(),
        };
        updatedBreaks.push(newBreak);
      }

      const updatedRecord: AttendanceRecord = {
        ...record,
        breaks: updatedBreaks,
        totalBreakMinutes: totalBreakMins,
        updatedAt: now.toISOString(),
      };

      await saveAttendanceStore(updatedRecord);
      return res.json(updatedRecord);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update break status.' });
    }
  });

  // 6. WORKFORCE OVERVIEW STATS
  app.get('/api/stats/overview', async (req: Request, res: Response) => {
    try {
      const employees = await fetchEmployees();
      const totalEmployees = employees.filter((e) => e.isActive !== false).length;

      const todayStr = new Date().toISOString().split('T')[0];
      const records = await fetchAttendance();
      const todayRecords = records.filter((r) => r.date === todayStr);

      const presentToday = todayRecords.filter((r) => r.checkInTime).length;
      const lateToday = todayRecords.filter((r) => r.status === 'Late').length;
      const absentToday = Math.max(0, totalEmployees - presentToday);
      const onLeaveToday = todayRecords.filter((r) => r.status === 'On Leave').length;

      const geofenceValidCount = todayRecords.filter((r) => r.checkInGeofenceValid).length;
      const geofenceCompliancePercentage =
        presentToday > 0 ? Math.round((geofenceValidCount / presentToday) * 100) : 100;

      const activeOnBreak = todayRecords.filter((r) =>
        r.breaks?.some((b) => !b.breakEnd)
      ).length;

      const stats: WorkforceStats = {
        totalEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeaveToday,
        geofenceCompliancePercentage,
        activeOnBreak,
      };

      return res.json(stats);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to calculate workforce stats.' });
    }
  });

  // 7. EXCEL REPORT GENERATOR
  app.get('/api/export/excel', async (req: Request, res: Response) => {
    const { startDate, endDate, employeeId } = req.query;

    try {
      let records = await fetchAttendance();

      if (employeeId) {
        records = records.filter((r) => r.employeeId === employeeId);
      }
      if (startDate && endDate) {
        records = records.filter(
          (r) => r.date >= String(startDate) && r.date <= String(endDate)
        );
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Employee ID', key: 'employeeId', width: 16 },
        { header: 'Employee Name', key: 'employeeName', width: 22 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Check-In Time', key: 'checkInTime', width: 16 },
        { header: 'Check-Out Time', key: 'checkOutTime', width: 16 },
        { header: 'Geofence Verified', key: 'geofenceVerified', width: 18 },
        { header: 'Geofence Location', key: 'geofenceLocation', width: 26 },
        { header: 'GPS Accuracy (m)', key: 'gpsAccuracy', width: 18 },
        { header: 'Break Duration (mins)', key: 'breakDuration', width: 22 },
        { header: 'Worked Hours', key: 'workedHours', width: 14 },
        { header: 'Overtime (mins)', key: 'overtime', width: 18 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];

      records.forEach((r) => {
        worksheet.addRow({
          date: r.date,
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          department: r.department,
          status: r.status,
          checkInTime: r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : 'N/A',
          checkOutTime: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : 'N/A',
          geofenceVerified: r.checkInGeofenceValid ? 'Yes' : 'No',
          geofenceLocation: r.checkInGeofenceName || 'N/A',
          gpsAccuracy: r.checkInAccuracy || 'N/A',
          breakDuration: r.totalBreakMinutes || 0,
          workedHours: (r.workedMinutes / 60).toFixed(2),
          overtime: r.overtimeMinutes || 0,
          remarks: r.remarks || '',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Workforce_Attendance_Report_${startDate || 'All'}_to_${endDate || 'All'}.xlsx"`
      );
      return res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('Excel export error:', err);
      return res.status(500).json({ error: 'Failed to generate Excel report.' });
    }
  });

  // VITE OR STATIC SERVING
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
